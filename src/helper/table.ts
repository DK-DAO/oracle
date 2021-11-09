import { Knex } from 'knex';

export function addCreatedAndUpdated(knex: Knex, table: Knex.CreateTableBuilder) {
  table.timestamp('createdDate').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP')).comment('Created date');
  table
    .timestamp('updatedDate')
    .notNullable()
    .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    .comment('Last updated date');
  table.index(['updatedDate', 'createdDate'], 'timestamp_indexed');
}

export default {
  addCreatedAndUpdated,
};
