import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('dk_card', (table) => {
    table.dropForeign('blockchainId');
    table.dropForeign('tokenId');
    table.dropColumns('tokenId', 'blockchainId');
  });
}

export async function down(): Promise<void> {
  //
}
