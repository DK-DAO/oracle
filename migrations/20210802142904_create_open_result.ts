import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('open_result', (table: Knex.CreateTableBuilder) => {
    table.increments('id').unsigned().notNullable().primary();

    table.integer('blockchainId').unsigned().references('blockchain.id').comment('Foreign key to blockchain.id');

    table.integer('tokenId').unsigned().references('token.id').comment('Foreign key to token.id');

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

    table.timestamp('createdDate').defaultTo(knex.fn.now()).index().comment('Created date');

    table.index(['blockchainId', 'transactionHash', 'tokenId', 'owner', 'nftTokenId', 'createdDate'], 'indexed_fields');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('open_result');
}
