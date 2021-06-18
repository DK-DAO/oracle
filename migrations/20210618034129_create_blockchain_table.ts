import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('blockchain', (table: Knex.CreateTableBuilder) => {
    table.increments('id').unsigned().notNullable().primary();

    table.string('name', 32).notNullable().comment('Blockchain name');

    table.string('url', 1024).notNullable().comment('JSON RPC URL');

    table.timestamp('createdDate').comment('Created date');

    table.index(['name', 'createdDate'], 'indexed_fields');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('blockchain');
}
