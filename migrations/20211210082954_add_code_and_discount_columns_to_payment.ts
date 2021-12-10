import { Knex } from 'knex';
import config from '../src/helper/config';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable(config.table.payment, (table: Knex.AlterTableBuilder) => {
    table.float('discount').comment('Discount percent');
    table.string('code', 32).index().comment('Code of this discount');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable(config.table.payment, (table: Knex.AlterTableBuilder) => {
    table.dropColumn('discount');
    table.dropColumn('code');
  });
}
