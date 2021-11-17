import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.nftOwnership, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table.bigInteger('tokenId').unsigned().references(`${config.table.token}.id`).comment('Foreign key to token.id');

    table.string('owner', 42).notNullable().index().comment('Owner of NFT token');

    table.string('nftTokenId', 66).notNullable().unique().index().comment('Token id of NFT');

    table.string('transactionHash', 66).notNullable().index().comment('Transaction of the issuance');

    addCreatedAndUpdated(knex, table);

    table.index(['tokenId', 'transactionHash', 'owner', 'nftTokenId'], 'common_indexed');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(config.table.nftOwnership);
}
