/* eslint-disable no-await-in-loop */
import { ethers } from 'ethers';
import { Knex } from 'knex';
import config from '../src/helper/config';
import { IBlockchain } from '../src/model/model-blockchain';
import { EWatching } from '../src/model/model-watching';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex(config.table.watching).del();

  const activeChains = config.networkRpc.filter((e) => ethers.utils.isAddress(e.watching));

  for (let i = 0; i < activeChains.length; i += 1) {
    const chain = activeChains[i];

    // Inserts seed entries
    const blockchain = <IBlockchain>await knex(config.table.blockchain).where({ chainId: chain.chainId }).first();

    await knex(config.table.watching).insert({
      blockchainId: blockchain.id,
      type: EWatching.Payment,
      name: `Payment on ${blockchain.name}`,
      address: chain.watching,
    });
  }
}

export default seed;
