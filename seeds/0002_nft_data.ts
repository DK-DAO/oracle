/* eslint-disable no-await-in-loop */
import { ethers } from 'ethers';
import { Knex } from 'knex';
import config from '../src/helper/config';
import { IBlockchain } from '../src/model/model-blockchain';
import { abi as abiNFT } from '../artifacts/NFT.json';
import { abi as abiRegistry } from '../artifacts/Registry.json';
import { NFT, Registry } from '../typechain';
import { stringToBytes32 } from '../src/helper/utilities';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex(config.table.config).del();

  const activeChains = config.networkRpc.filter((e) => ethers.utils.isAddress(e.registry));

  for (let i = 0; i < activeChains.length; i += 1) {
    const chain = activeChains[i];

    // Inserts seed entries
    const blockchain = <IBlockchain>await knex(config.table.blockchain).where({ chainId: chain.chainId }).first();
    const provider = new ethers.providers.StaticJsonRpcProvider(blockchain.url);

    const registry = <Registry>new ethers.Contract(chain.registry, abiRegistry, provider);
    const cardAddress = await registry.getAddress(stringToBytes32('Duelist King'), stringToBytes32('NFT Card'));
    const itemAddress = await registry.getAddress(stringToBytes32('Duelist King'), stringToBytes32('NFT Item'));
    const card = <NFT>new ethers.Contract(cardAddress, abiNFT, provider);
    const item = <NFT>new ethers.Contract(itemAddress, abiNFT, provider);

    await knex.batchInsert(config.table.config, [
      {
        blockchainId: blockchain.id,
        key: 'contractDistributor',
        type: 'string',
        value: Buffer.from(await registry.getAddress(stringToBytes32('Duelist King'), stringToBytes32('Distributor'))),
      },
      {
        blockchainId: blockchain.id,
        key: 'contractDuelistKingOracleProxy',
        type: 'string',
        value: Buffer.from(await registry.getAddress(stringToBytes32('Duelist King'), stringToBytes32('Oracle'))),
      },
      {
        blockchainId: blockchain.id,
        key: 'contractRNG',
        type: 'string',
        value: Buffer.from(await registry.getAddress(stringToBytes32('Infrastructure'), stringToBytes32('RNG'))),
      },
      {
        blockchainId: blockchain.id,
        key: 'contractDKDAOOracle',
        type: 'string',
        value: Buffer.from(await registry.getAddress(stringToBytes32('Infrastructure'), stringToBytes32('Oracle'))),
      },
    ]);

    await knex.batchInsert(config.table.token, [
      {
        address: cardAddress,
        type: 721,
        name: await card.name(),
        symbol: await card.symbol(),
        blockchainId: blockchain.id,
      },
      {
        address: itemAddress,
        type: 721,
        name: await item.name(),
        symbol: await item.symbol(),
        blockchainId: blockchain.id,
      },
    ]);
  }
}

export default seed;
