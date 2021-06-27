import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('blockchain', (table: Knex.CreateTableBuilder) => {
    table.increments('id').unsigned().notNullable().primary();

    table.integer('chainId').unsigned().notNullable().comment('Chain id of current network');

    table.string('nativeToken', 32).notNullable().comment('Token symbol');

    table.string('explorerUrl', 256).notNullable().comment('Block explorer URL');

    table.string('name', 32).notNullable().comment('Blockchain name');

    table.string('url', 1024).notNullable().comment('JSON RPC URL');

    table.timestamp('createdDate').defaultTo(knex.fn.now()).index().comment('Created date');

    table.index(['name', 'chainId', 'nativeToken'], 'indexed_fields');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('blockchain');
}
