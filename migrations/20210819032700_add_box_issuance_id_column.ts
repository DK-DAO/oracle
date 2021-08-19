/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('open_schedule', (table) => {
    table
      .bigInteger('issuanceId')
      .unsigned()
      .index()
      .comment('Issuance id to link issued cards and boxes');
  });

  await knex.schema.alterTable('open_result', (table) => {
    table
      .bigInteger('issuanceId')
      .index()
      .unsigned()
      .comment('Issuance id to link issued cards and boxes');
  });

  const openScheduleList = await knex('open_schedule');
  let issuanceId = 1;
  const tx = await knex.transaction();
  try {
    for (let i = 0; i < openScheduleList.length; i += 1) {
      await tx('open_schedule')
        .update({
          issuanceId,
        })
        .where({ id: openScheduleList[i].id });
      await tx('open_result')
        .update({
          issuanceId,
        })
        .where({
          transactionHash: openScheduleList[i].transactionHash,
        });
      issuanceId += 1;
    }
    await tx.commit();
  } catch (err) {
    await tx.rollback();
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('open_schedule', (table) => {
    table.dropColumn('issuanceId');
  });
  return knex.schema.alterTable('open_result', (table) => {
    table.dropColumn('issuanceId');
  });
}
