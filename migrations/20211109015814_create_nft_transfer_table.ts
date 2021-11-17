import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';
import { ENftTransferStatus } from '../src/model/model-nft-transfer';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.nftTransfer, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table
      .bigInteger('blockchainId')
      .unsigned()
      .references(`${config.table.blockchain}.id`)
      .comment('Foreign key to blockchain.id');

    table.bigInteger('tokenId').unsigned().references(`${config.table.token}.id`).comment('Foreign key to token.id');

    table
      .integer('status')
      .notNullable()
      .defaultTo(ENftTransferStatus.NewNftTransfer)
      .comment('Status of the processing of nft transfer');

    table.string('issuanceUuid', 36).comment('Issuance uuid to link payment transaction and boxes, cards');

    table.string('eventId', 66).unique().index().comment('Unique event Id, for tracking');

    table.string('sender', 42).notNullable().comment('Sender');

    table.string('receiver', 42).notNullable().index().comment('Receiver');

    table.string('nftTokenId', 66).notNullable().comment('Id of NFT token');

    table.bigInteger('blockNumber').unsigned().comment('Block number of nft transfer');

    table.string('blockHash', 66).notNullable().comment('Block hash');

    table.string('transactionHash', 66).notNullable().comment('Transaction hash');

    table.string('contractAddress', 42).notNullable().comment('Smart contract address that emit nft transfer event');

    addCreatedAndUpdated(knex, table);

    table.index(
      [
        'status',
        'blockchainId',
        'tokenId',
        'issuanceUuid',
        'sender',
        'receiver',
        'nftTokenId',
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
  return knex.schema.dropTable(config.table.nftTransfer);
}
