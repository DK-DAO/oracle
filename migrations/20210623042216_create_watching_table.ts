import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.watching, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table
      .bigInteger('blockchainId')
      .unsigned()
      .references(`${config.table.blockchain}.id`)
      .comment('Foreign key to blockchain.id');

    table.integer('type').unsigned().notNullable().defaultTo(0).comment('Type of watching account');

    table.string('name', 32).notNullable().comment('Name of receiver address');

    table.string('address', 42).notNullable().index().comment('Receiver address');

    addCreatedAndUpdated(knex, table);

    table.index(['blockchainId', 'address', 'type'], 'common_indexed');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(config.table.watching);
}
