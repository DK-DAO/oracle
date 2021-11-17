import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.secret, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table
      .bigInteger('blockchainId')
      .unsigned()
      .references(`${config.table.blockchain}.id`)
      .comment('Foreign key to blockchain.id');

    table.string('secret', 66).notNullable().comment('Secret value');

    table.string('digest', 66).notNullable().index().comment('Digest of secret value');

    table.integer('status').notNullable().defaultTo(0).comment('Status of secret, 0-new, 1-revealed, 255-error');

    addCreatedAndUpdated(knex, table);

    table.index(['secret', 'digest', 'status'], 'common_indexed');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(config.table.secret);
}
