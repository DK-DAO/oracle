/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
import { ethers } from 'ethers';
import { Knex } from 'knex';
import { IToken } from '../src/model/model-token';
import config from '../src/helper/config';
import { IBlockchain } from '../src/model/model-blockchain';
import { abi as abiDistributor } from '../artifacts/contracts/dk/DuelistKingDistributor.sol/DuelistKingDistributor.json';
import { abi as abiErc721 } from '../artifacts/contracts/libraries/ERC721.sol/ERC721.json';
import { DuelistKingDistributor, ERC721 } from '../typechain';

export async function up(knex: Knex): Promise<void> {
  const nftList: Partial<IToken>[] = [];
  const blockchain = <IBlockchain>await knex('blockchain').where({ chainId: config.activeChainId }).first();
  const provider = new ethers.providers.JsonRpcProvider(blockchain.url);
  const distributor = <DuelistKingDistributor>(
    new ethers.Contract(config.addressDuelistKingFairDistributor, abiDistributor, provider)
  );
  for (let i = 1; i < 21; i += 1) {
    const cardAddress = await distributor.getCard(i);
    const card = <ERC721>new ethers.Contract(cardAddress, abiErc721, provider);
    nftList.push({
      address: cardAddress,
      type: 721,
      name: await card.name(),
      symbol: await card.symbol(),
      blockchainId: blockchain.id,
    });
  }

  await knex.batchInsert('token', nftList);
}

export async function down(knex: Knex): Promise<void> {
  await knex('nft_ownership').delete();
}
