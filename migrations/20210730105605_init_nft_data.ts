/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
import { ethers } from 'ethers';
import { Knex } from 'knex';
import { IToken } from '../src/model/model-token';
import config from '../src/helper/config';
import { IBlockchain } from '../src/model/model-blockchain';
import { abi as abiNFT } from '../artifacts/NFT.json';
import { abi as abiRegistry } from '../artifacts/Registry.json';
import { NFT, Registry } from '../typechain';
import { IConfig } from '../src/model/model-config';
import { stringToBytes32 } from '../src/helper/utilities';

export async function up(knex: Knex): Promise<void> {
  const nftList: Partial<IToken>[] = [];
  const blockchain = <IBlockchain>await knex('blockchain').where({ chainId: config.activeChainId }).first();
  const provider = new ethers.providers.StaticJsonRpcProvider(blockchain.url);
  const registry = <Registry>new ethers.Contract(config.addressRegistry, abiRegistry, provider);
  const cardAddress = await registry.getAddress(stringToBytes32('DKDAO Infrastructure'), stringToBytes32('NFT'));
  const card = <NFT>new ethers.Contract(cardAddress, abiNFT, provider);
  nftList.push({
    address: cardAddress,
    type: 721,
    name: await card.name(),
    symbol: await card.symbol(),
    blockchainId: blockchain.id,
  });

  await knex('config').insert(<Partial<IConfig>>{
    key: 'contractDistributor',
    type: 'string',
    value: Buffer.from(await registry.getAddress(stringToBytes32('Duelist King'), stringToBytes32('Distributor'))),
  });

  await knex('config').insert(<Partial<IConfig>>{
    key: 'contractDuelistKingOracleProxy',
    type: 'string',
    value: Buffer.from(await registry.getAddress(stringToBytes32('Duelist King'), stringToBytes32('Oracle'))),
  });

  await knex('config').insert(<Partial<IConfig>>{
    key: 'contractRNG',
    type: 'string',
    value: Buffer.from(await registry.getAddress(stringToBytes32('DKDAO Infrastructure'), stringToBytes32('RNG'))),
  });

  await knex('config').insert(<Partial<IConfig>>{
    key: 'contractDKDAOOracle',
    type: 'string',
    value: Buffer.from(await registry.getAddress(stringToBytes32('DKDAO Infrastructure'), stringToBytes32('Oracle'))),
  });

  await knex.batchInsert('token', nftList);
}

export async function down(knex: Knex): Promise<void> {
  await knex('nft_ownership').delete();
}
