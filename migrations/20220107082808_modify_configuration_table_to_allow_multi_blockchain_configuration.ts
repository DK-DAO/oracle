import { Knex } from 'knex';
import config from '../src/helper/config';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable(config.table.config, (table: Knex.AlterTableBuilder) => {
    table.dropUnique(['key']);
    table
      .bigInteger('blockchainId')
      .unsigned()
      .references(`${config.table.blockchain}.id`)
      .comment('Foreign key to blockchain.id');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable(config.table.config, (table: Knex.AlterTableBuilder) => {
    table.dropColumn('blockchainId');
  });
}
