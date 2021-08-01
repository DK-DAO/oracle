/* eslint-disable no-await-in-loop */
import { utils } from 'ethers';
import { Knex } from 'knex';
import BytesBuffer from '../src/helper/bytes-buffer';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('event', (table) => {
    table.string('eventId', 66).unique().index().comment('Unique event Id');
  });

  const data = await knex('event').select('*');
  for (let i = 0; i < data.length; i += 1) {
    const { from, to, value, transactionHash, contractAddress } = data[i];
    const buf = new BytesBuffer();

    await knex('event')
      .update({
        eventId: utils.sha256(
          buf
            .writeAddress(from)
            .writeAddress(to)
            .writeAddress(contractAddress)
            .writeUint256(value)
            .writeUint256(transactionHash)
            .invoke(),
        ),
      })
      .where({ id: data[i].id });
  }
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('event', (table) => {
    table.dropColumn('eventId');
  });
}
