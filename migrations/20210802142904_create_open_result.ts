import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('open_result', (table: Knex.CreateTableBuilder) => {
    table.increments('id').unsigned().notNullable().primary();

    table.integer('blockchainId').unsigned().references('blockchain.id').comment('Foreign key to blockchain.id');

    table.integer('tokenId').unsigned().references('token.id').comment('Foreign key to token.id');

    table.string('owner', 42).notNullable().comment('Owner of NFT token');

    table.string('nftTokenId', 66).notNullable().unique().comment('Token id of NFT');

    table.integer('cardId').notNullable().comment('Card Id to return to front-end');

    table.integer('rareness').notNullable().defaultTo(1).comment('Rareness of the card');

    table.string('transactionHash', 66).notNullable().comment('Transaction of the issuance');

    table.timestamp('createdDate').defaultTo(knex.fn.now()).index().comment('Created date');

    table.index(['blockchainId', 'transactionHash', 'tokenId', 'owner', 'nftTokenId', 'createdDate'], 'indexed_fields');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('open_result');
}
