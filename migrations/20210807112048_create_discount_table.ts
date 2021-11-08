import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.discount, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table.integer('phase').notNullable().comment('Phase of cad sale');

    table.string('address', 256).notNullable().comment('Address that receive the discount');

    table.float('discount').comment('Discount amount');

    table.string('code', 32).notNullable().comment('Code of this discount');

    table.string('memo', 255).notNullable().comment('Memo of this discount');

    addCreatedAndUpdated(knex, table);

    table.index(['phase', 'address', 'discount', 'code', 'memo'], 'common_indexed');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(config.table.discount);
}
