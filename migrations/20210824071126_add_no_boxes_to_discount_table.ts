/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('discount', (table) => {
    table.integer('noBoxes').unsigned().defaultTo(0).comment('Total number of boxes');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('discount', (table) => {
    table.dropColumn('noBoxes');
  });
}
