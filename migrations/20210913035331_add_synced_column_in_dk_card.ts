/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('dk_card', (table) => {
    table.boolean('synced').index().defaultTo(false).comment('Is this row synced?');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('dk_card', (table) => {
    table.dropColumn('synced');
  });
}
