/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('blockchain', (table) => {
    table.integer('safeConfirmations').notNullable().unsigned().comment('Number of confirmations need to be safe');
    table.integer('numberOfBlocksToSync').notNullable().unsigned().comment('Number of block to be synced');
    table.integer('numberOfBlocksToWorker').notNullable().unsigned().comment('Number of block to be split to worker');
  });

  // 6 on Ethereum is quite safe, but 12 is the best
  await knex('blockchain')
    .update({
      safeConfirmations: 12,
      numberOfBlocksToSync: 100,
      numberOfBlocksToWorker: 25,
    })
    .where({ chainId: 1 });

  // Just 20, i think it's enough
  await knex('blockchain')
    .update({
      safeConfirmations: 20,
      numberOfBlocksToSync: 100,
      numberOfBlocksToWorker: 25,
    })
    .where({ chainId: 56 });

  // Chain reorganization issue on Polygon that's why we increase from 6 to 30
  await knex('blockchain')
    .update({
      safeConfirmations: 30,
      numberOfBlocksToSync: 100,
      numberOfBlocksToWorker: 25,
    })
    .where({ chainId: 137 });

  // Test networks
  await knex('blockchain')
    .update({
      safeConfirmations: 6,
      numberOfBlocksToSync: 100,
      numberOfBlocksToWorker: 25,
    })
    .whereNotIn('chainId', [1, 56, 137]);
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('blockchain', (table) => {
    table.dropColumn('safeConfirmations');
    table.dropColumn('numberOfBlocksToSync');
    table.dropColumn('numberOfBlocksToWorker');
  });
}
