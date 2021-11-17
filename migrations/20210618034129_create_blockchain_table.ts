import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.blockchain, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table.integer('chainId').unsigned().index().notNullable().comment('Chain id of current network');

    table.string('nativeToken', 32).notNullable().comment('Native token symbol');

    table.string('explorerUrl', 256).notNullable().comment('Block explorer URL');

    table.string('name', 32).notNullable().comment('Blockchain name');

    table.integer('safeConfirmation').unsigned().notNullable().comment('Number of confirmations need to be safe');

    table.integer('numberOfSyncBlock').unsigned().notNullable().comment('Number of block to be synced');

    table
      .integer('numberOfProcessBlock')
      .unsigned()
      .notNullable()
      .comment('Number of block to be split and process by workers');

    table.string('url', 1024).notNullable().comment('JSON RPC URL');

    addCreatedAndUpdated(knex, table);

    table.index(['name', 'chainId', 'nativeToken'], 'common_indexed');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(config.table.blockchain);
}
