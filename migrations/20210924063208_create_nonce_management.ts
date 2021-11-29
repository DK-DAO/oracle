import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.nonceManagement, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table
      .bigInteger('blockchainId')
      .unsigned()
      .references(`${config.table.blockchain}.id`)
      .comment('Foreign key to blockchain.id');

    table.string('address', 42).notNullable().index().comment('Cached nonce address');

    table.bigInteger('nonce').unsigned().comment('Nonce number');

    addCreatedAndUpdated(knex, table);

    table.index(['address', 'blockchainId'], 'common_indexed');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(config.table.nonceManagement);
}

