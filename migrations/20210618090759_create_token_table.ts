import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('token', (table: Knex.CreateTableBuilder) => {
    table.increments('id').unsigned().notNullable().primary();

    table.integer('blockchainId').unsigned().references('blockchain.id').comment('Foreign key to blockchain.id');

    table.string('name', 32).notNullable().comment('Start of syncing');

    table.string('symbol', 32).notNullable().comment('Synced blocks');

    table.integer('decimal').notNullable().comment('End of syncing');

    table.string('address', 256).notNullable().comment('Synced blocks');

    table.timestamp('createdDate').defaultTo(knex.fn.now()).index().comment('Created date');

    table.index(['name', 'symbol', 'decimal', 'address'], 'indexed_fields');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('token');
}
   