import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.openResult, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table
      .bigInteger('blockchainId')
      .unsigned()
      .references(`${config.table.blockchain}.id`)
      .comment('Foreign key to blockchain.id');

    table.string('issuanceUuid', 36).notNullable().comment('Issuance uuid to link issued cards and boxes');

    table.string('owner', 42).notNullable().comment('Owner of NFT token');

    table.string('nftTokenId', 66).notNullable().unique().comment('Token id of NFT');

    table.bigInteger('applicationId').notNullable().comment('Application Id of the item');

    table.integer('itemEdition').notNullable().comment('Edition of the item');

    table.integer('itemGeneration').notNullable().comment('Generation of the item');

    table.integer('itemRareness').notNullable().comment('Rareness of the item');

    table.integer('itemType').notNullable().comment('Type of the item');

    table.bigInteger('itemId').notNullable().comment('Id  of the item');

    table.bigInteger('itemSerial').notNullable().comment('Serial of the item');

    table.string('transactionHash', 66).notNullable().comment('Transaction of the issuance');

    addCreatedAndUpdated(knex, table);

    table.index(['blockchainId', 'transactionHash', 'owner', 'nftTokenId', 'issuanceUuid'], 'common_indexed');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(config.table.openResult);
}
