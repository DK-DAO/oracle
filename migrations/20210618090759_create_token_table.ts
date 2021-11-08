import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.token, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table
      .bigInteger('blockchainId')
      .unsigned()
      .references(`${config.table.blockchain}.id`)
      .comment('Foreign key to blockchain.id');

    // 20-ERC20 721-ERC721
    table.integer('type').unsigned().notNullable().defaultTo(20).comment('Token type ERC20 or ERC721');

    table.string('name', 32).notNullable().comment('Token name');

    table.string('symbol', 32).notNullable().comment('Token symbol');

    table.integer('decimal').unsigned().defaultTo(18).comment('Token decimals');

    table.string('address', 42).notNullable().comment('Token address');

    addCreatedAndUpdated(knex, table);

    table.index(['name', 'symbol', 'address'], 'common_indexed');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(config.table.token);
}
