import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('discount', (table: Knex.CreateTableBuilder) => {
    table.increments('id').unsigned().notNullable().primary();

    table.integer('campaignId').notNullable().comment('Campaign Id of cad sale');

    table.string('address', 42).notNullable().comment('Address that receive the discount');

    table.float('discount').comment('Discount amount');

    table.string('memo', 255).notNullable().comment('Memo of this discount');

    table.timestamp('createdDate').defaultTo(knex.fn.now()).index().comment('Created date');

    table.index(['campaignId', 'address', 'discount', 'memo', 'createdDate'], 'indexed_fields');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('discount');
}
