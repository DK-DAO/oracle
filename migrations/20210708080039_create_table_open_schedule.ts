import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('open_schedule', (table: Knex.CreateTableBuilder) => {
    table.increments('id').unsigned().notNullable().primary();

    table.integer('campaignId').notNullable().comment('Campaign Id of cad sale');

    table.integer('numberOfBox').notNullable().comment('Number of loot box going to to open');

    table.string('owner', 42).notNullable().comment('Address of owner');

    table.string('memo', 255).notNullable().comment('Memo of issuance');

    table.integer('status').defaultTo(0).comment('Processing status of loot boxes opening');

    table.timestamp('updatedDate').defaultTo(knex.fn.now()).index().comment('Updated date');

    table.timestamp('createdDate').defaultTo(knex.fn.now()).index().comment('Created date');

    table.index(['campaignId', 'numberOfBox', 'owner', 'createdDate', 'updatedDate'], 'indexed_fields');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('open_schedule');
}
