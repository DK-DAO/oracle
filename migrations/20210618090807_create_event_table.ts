import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('event', (table: Knex.CreateTableBuilder) => {
    table.increments('id').unsigned().notNullable().primary();

    table.integer('blockchainId').unsigned().references('blockchain.id').comment('Foreign key to blockchain.id');
    
    table.integer('tokenId').unsigned().references('token.id').comment('Foreign key to token.id');

    table.string('eventName', 255).notNullable().comment('Event name, that depend on what will EVM emit');

    table.boolean('processed').notNullable().defaultTo(false).comment('Is the event processed');

    table.string('from', 42).notNullable().comment('Sender');

    table.string('to', 42).notNullable().comment('Receiver');

    table.decimal('value', 64, 0).notNullable().comment('Value of transaction');

    table.json('topics').notNullable().comment('Topics data in JSON format');

    table.binary('rawData').comment('Binary data that returned from EVM');

    table.json('jsonData').comment('Parsed json from raw data');

    table.bigInteger('blockNumber').unsigned().comment('Block number of event');

    table.string('blockHash', 66).notNullable().comment('Block hash');

    table.string('memo', 255).comment('Event memo, just in case it help our operator to remember something');

    table.string('contractAddress', 42).notNullable().comment('Smart contract address that emit the event');

    table.string('transactionHash', 66).notNullable().comment('Transaction hash');

    table.timestamp('createdDate').defaultTo(knex.fn.now()).index().comment('Created date');

    table.index(
      [
        'blockchainId',
        'from',
        'to',
        'value',
        'eventName',
        'processed',
        'blockHash',
        'transactionHash',
        'contractAddress',
      ],
      'indexed_fields',
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('event');
}
