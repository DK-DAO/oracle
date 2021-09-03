import { Knex } from 'knex';
import Card from '../src/helper/card';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('dk_card', (table: Knex.CreateTableBuilder) => {
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

  const ntfOwnershipData = await knex('nft_ownership').select(
    'blockchainId',
    'tokenId',
    'nftTokenId',
    'transactionHash',
    'owner',
  );
  const records = ntfOwnershipData.map((item) => {
    const card = Card.from(item.nftTokenId);
    return {
      ...item,
      applicationId: Number(card.getApplicationId()),
      itemEdition: card.getEdition(),
      itemGeneration: card.getGeneration(),
      itemRareness: card.getRareness(),
      itemType: card.getType(),
      itemId: Number(card.getId()),
      itemSerial: Number(card.getSerial()),
    };
  });
  await knex.batchInsert('dk_card', records);
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('dk_card');
}
