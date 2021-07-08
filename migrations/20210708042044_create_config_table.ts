import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('config', (table: Knex.CreateTableBuilder) => {
    table.increments('id').unsigned().notNullable().primary();

    table.string('key', 255).unique().notNullable().comment('Key of data');

    table.string('type', 255).notNullable().comment('Type of data, to perform auto convert');

    table.binary('value').notNullable().comment('Value of data');

    table.timestamp('createdDate').defaultTo(knex.fn.now()).index().comment('Created date');

    table.timestamp('updatedDate').defaultTo(knex.fn.now()).index().comment('Updated date');

    table.index(['key', 'createdDate', 'updatedDate']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('config');
}
