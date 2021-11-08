import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.sync, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table
      .bigInteger('blockchainId')
      .unsigned()
      .references(`${config.table.blockchain}.id`)
      .comment('Foreign key to blockchain.id');

    table.bigInteger('startBlock').unsigned().notNullable().comment('Start of syncing');

    table.bigInteger('syncedBlock').unsigned().notNullable().comment('Synced blocks');

    table.bigInteger('targetBlock').unsigned().notNullable().comment('Target of syncing');

    addCreatedAndUpdated(knex, table);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(config.table.sync);
}
