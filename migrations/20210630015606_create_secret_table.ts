import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('secret', (table: Knex.CreateTableBuilder) => {
    table.increments('id').unsigned().notNullable().primary();

    table.integer('blockchainId').unsigned().references('blockchain.id').comment('Foreign key to blockchain.id');

    table.string('secret', 66).notNullable().comment('Secret value');

    table.string('digest', 66).notNullable().comment('Digest of secret value');

    table.integer('status').notNullable().defaultTo(0).comment('Status of secert, 0-new, 1-revealed, 255-error');

    table.timestamp('createdDate').defaultTo(knex.fn.now()).index().comment('Created date');

    table.index(['secret', 'digest', 'status'], 'indexed_fields');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('secret');
}
