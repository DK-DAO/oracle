import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.config, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table.string('key', 255).unique().notNullable().comment('Key of data');

    table.string('type', 255).notNullable().comment('Type of data, to perform auto convert');

    table.binary('value').notNullable().comment('Value of data');

    addCreatedAndUpdated(knex, table);

    table.index(['key', 'type'], 'common_indexed');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(config.table.config);
}
