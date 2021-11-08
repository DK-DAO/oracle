import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.nonceManagement, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table.integer('chainId').unsigned().notNullable().comment('Chain id of current network');

    table.string('address', 42).notNullable().comment('Cached nonce address');

    table.bigInteger('nonce').unsigned().comment('Nonce number');

    addCreatedAndUpdated(knex, table);

    table.index(['address', 'nonce', 'chainId'], 'common_indexed');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(config.table.nonceManagement);
}
