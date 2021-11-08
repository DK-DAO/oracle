import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.event, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table
      .bigInteger('blockchainId')
      .unsigned()
      .references(`${config.table.blockchain}.id`)
      .comment('Foreign key to blockchain.id');

    table.string('eventName', 64).notNullable().comment('Event name, that depend on what will EVM emit');

    table.integer('status').notNullable().defaultTo(0).comment('Status of the processing of event');

    table.string('eventId', 66).unique().index().comment('Unique event Id, for tracking');

    table.string('issuanceUuid', 36).unique().index().comment('Issuance uuid to link payment transaction and boxes');

    table.string('from', 42).notNullable().comment('Sender');

    table.string('to', 42).notNullable().comment('Receiver');

    table.string('value', 66).notNullable().comment('Value of transaction');

    table.bigInteger('blockNumber').unsigned().comment('Block number of event');

    table.string('blockHash', 66).notNullable().comment('Block hash');

    table.string('transactionHash', 66).notNullable().comment('Transaction hash');

    table.string('contractAddress', 42).notNullable().comment('Smart contract address that emit the event');

    addCreatedAndUpdated(knex, table);

    table.index(
      [
        'blockchainId',
        'from',
        'to',
        'value',
        'eventName',
        'status',
        'blockNumber',
        'blockHash',
        'transactionHash',
        'contractAddress',
      ],
      'common_indexed',
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(config.table.event);
}
