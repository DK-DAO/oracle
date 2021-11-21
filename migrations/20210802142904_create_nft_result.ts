import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.nftResult, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table.bigInteger('tokenId').unsigned().references(`${config.table.token}.id`).comment('Foreign key to token.id');

    table.string('issuanceUuid', 36).notNullable().comment('Issuance uuid to link payment and boxes');

    table.string('owner', 42).notNullable().index().comment('Owner of NFT token');

    table.string('nftTokenId', 66).notNullable().unique().index().comment('Token id of NFT');

    table.string('nftBoxId', 66).index().comment('Token id of NFT box');

    table.bigInteger('applicationId').notNullable().comment('Application Id of the item');

    table.integer('itemEdition').notNullable().comment('Edition of the item');

    table.integer('itemGeneration').notNullable().comment('Generation of the item');

    table.integer('itemRareness').notNullable().comment('Rareness of the item');

    table.integer('itemType').notNullable().comment('Type of the item');

    table.bigInteger('itemId').notNullable().index().comment('Id  of the item');

    table.bigInteger('itemSerial').notNullable().index().comment('Serial of the item');

    table.string('transactionHash', 66).notNullable().comment('Transaction of the issuance');

    addCreatedAndUpdated(knex, table);

    table.index(
      [
        'tokenId',
        'transactionHash',
        'owner',
        'nftTokenId',
        'applicationId',
        'issuanceUuid',
        'itemSerial',
        'itemId',
        'itemType',
        'itemRareness',
        'itemGeneration',
        'itemEdition',
      ],
      'common_indexed',
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(config.table.nftResult);
}
