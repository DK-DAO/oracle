import { Knex } from 'knex';
import config from '../src/helper/config';
import { addCreatedAndUpdated } from '../src/helper/table';
import { ENftIssuanceStatus } from '../src/model/model-nft-issuance';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(config.table.nftIssuance, (table: Knex.CreateTableBuilder) => {
    table.bigIncrements('id').unsigned().primary();

    table.integer('phase').unsigned().notNullable().comment('Phase of cad sale');

    table.integer('numberOfBox').notNullable().comment('Number of loot box going to to open');

    table.string('issuanceUuid', 36).notNullable().comment('Issuance uuid to link payment transaction and boxes');

    table.integer('totalBoxes').unsigned().index().comment('Total number of boxes');

    table.string('transactionHash', 66).comment('Transaction hash of box issuance');

    table.string('owner', 42).notNullable().comment('Address of owner');

    table.integer('status').defaultTo(ENftIssuanceStatus.New).comment('Processing status of loot boxes opening');

    addCreatedAndUpdated(knex, table);

    table.index(['phase', 'numberOfBox', 'totalBoxes', 'transactionHash', 'owner', 'issuanceUuid'], 'common_indexed');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(config.table.nftIssuance);
}
