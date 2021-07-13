/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';
import { ModelBase } from './model-base';
import { EProcessingStatus, IEventDetail } from './model-event';

export enum EOpenScheduleStatus {
  New = 0,
  Opening = 1,
  Opened = 2,
  Error = 255,
}

export interface IOpenSchedule {
  id: number;
  campaignId: number;
  numberOfBox: number;
  owner: string;
  memo: string;
  status: EOpenScheduleStatus;
  updatedDate: string;
  createdDate: string;
}

export class ModelOpenSchedule extends ModelBase<IOpenSchedule> {
  constructor() {
    super('open_schedule');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select(
      'id',
      'campaignId',
      ' numberOfBox',
      'owner',
      'memo',
      'status',
      'updatedDate',
      'createdDate',
    );
  }

  // Perform batch buy based on recored event
  public async batchBuy(
    event: IEventDetail,
    records: Pick<IOpenSchedule, 'campaignId' | 'numberOfBox' | 'owner' | 'memo'>[],
  ): Promise<number[] | undefined> {
    const tx = await this.getKnex().transaction();
    const result: number[] = [];
    try {
      for (let i = 0; i < records.length; i += 1) {
        await tx(this.tableName).insert(records[i]);
        const { id } = await tx(this.tableName).select('id').whereRaw('`id`=LAST_INSERT_ID()').first();
        if (Number.isInteger(id)) {
          result.push(id);
        } else {
          throw new Error('Unable to insert a record to secret table');
        }
      }
      // Update status to successed
      await tx('event').update({ status: EProcessingStatus.Success }).where({ id: event.id });
      await tx.commit();
    } catch (err) {
      await tx('event').update({ status: EProcessingStatus.Error }).where({ id: event.id });
      await tx.rollback();
      throw err;
    }
    return result;
  }
}

export default ModelOpenSchedule;
