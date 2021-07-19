import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('transaction', (table: Knex.CreateTableBuilder) => {
    table.increments('id').unsigned().notNullable().primary();

    table.integer('blockchainId').unsigned().references('blockchain.id').comment('Foreign key to blockchain.id');
    
    table.integer('nftId').unsigned().references('nft.id').comment('Foreign key to nft.id');

    table.string('from', 42).notNullable().comment('Sender');

    table.string('to', 42).notNullable().comment('Receiver');

    table.string('nftTokenId', 66).notNullable().unique().comment('Value of transaction');

    table.bigInteger('blockNumber').unsigned().comment('Block number of event');

    table.string('blockHash', 66).notNullable().comment('Block hash');

    table.string('memo', 255).comment('Event memo, just in case it help our operator to remember something');

    table.string('contractAddress', 42).notNullable().comment('Smart contract address that emit the event');

    table.string('transactionHash', 66).notNullable().comment('Transaction hash');

    table.timestamp('createdDate').defaultTo(knex.fn.now()).index().comment('Created date');

    table.index(
      [
        'blockchainId',
        'nftId',
        'from',
        'to',
        'nftTokenId',
        'blockNumber',
        'blockHash',
        'transactionHash',
        'contractAddress',
      ],
      'indexed_fields',
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('transaction');
}
