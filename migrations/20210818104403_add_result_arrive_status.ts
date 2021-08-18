/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('open_schedule')
    .update({
      status: 3, // EOpenScheduleStatus.ResultArrived,
    })
    .where({
      status: 2, // EOpenScheduleStatus.Opened,
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex('open_schedule')
    .update({
      status: 2, // EOpenScheduleStatus.Opened,
    })
    .where({
      status: 3, // EOpenScheduleStatus.ResultArrived,
    });
}
