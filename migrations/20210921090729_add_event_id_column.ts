/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('open_schedule', (table) => {
    table.integer('eventId').unsigned().index().references('event.id').comment('Linked to eventId in event table');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('open_schedule', (table) => {
    table.dropColumn('eventId');
  });
}
