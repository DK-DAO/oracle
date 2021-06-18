import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('sync', (table: Knex.CreateTableBuilder) => {
    table.increments('id').unsigned().notNullable();

    table.integer('blockchainId').unsigned().references('blockchain.id').comment('Foreign key to blockchain.id');

    table.integer('startBlock').unsigned().notNullable().comment('Start of syncing');

    table.integer('syncedBlock').unsigned().notNullable().comment('Synced blocks');

    table.integer('targetBlock').unsigned().notNullable().comment('End of syncing');

    table.timestamp('lastUpdate').comment('Last update');

    table.timestamp('createdDate').comment('Created date');

    table.index(['id', 'startBlock', 'syncedBlock', 'targetBlock', 'lastUpdate'], 'indexed_fields');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('sync');
}
