/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('open_schedule', (table) => {
    table.integer('totalBoxes').unsigned().index().comment('Total number of boxes');
  });

  const openScheduleList = await knex('open_schedule')
    .select('*', knex.raw('SUM(`numberOfBox`) AS `totalBoxes`'))
    .groupBy('issuanceId');
  const tx = await knex.transaction();
  try {
    for (let i = 0; i < openScheduleList.length; i += 1) {
      await tx('open_schedule')
        .update({
          totalBoxes: openScheduleList[i].totalBoxes,
        })
        .where({ issuanceId: openScheduleList[i].issuanceId });
    }
    await tx.commit();
  } catch (err) {
    await tx.rollback();
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('open_schedule', (table) => {
    table.dropColumn('totalBoxes');
  });
}
