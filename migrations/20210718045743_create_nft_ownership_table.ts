import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('nft_ownership', (table: Knex.CreateTableBuilder) => {
    table.increments('id').unsigned().notNullable().primary();

    table.integer('blockchainId').unsigned().references('blockchain.id').comment('Foreign key to blockchain.id');

    table.integer('tokenId').unsigned().references('token.id').comment('Foreign key to token.id');

    table.string('owner', 42).notNullable().comment('Owner of NFT token');

    table.string('nftTokenId', 66).notNullable().unique().comment('Token id of NFT');

    table.timestamp('createdDate').defaultTo(knex.fn.now()).index().comment('Created date');

    table.index(['blockchainId', 'tokenId', 'owner', 'nftTokenId', 'createdDate'], 'indexed_fields');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('nft_ownership');
}
