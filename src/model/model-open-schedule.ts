/* eslint-disable no-await-in-loop */
import { ethers } from 'ethers';
import { Knex } from 'knex';
import { ModelBase } from './model-base';
import { EProcessingStatus, IEventDetail } from './model-event';
import logger from '../helper/logger';

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
  transactionHash: string | null;
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
      'numberOfBox',
      'transactionHash',
      'owner',
      'memo',
      'status',
      'updatedDate',
      'createdDate',
    );
  }

  public async openLootBox(
    contractCallback: (campaignId: number, owner: string, numberOfBox: number) => Promise<ethers.ContractTransaction>,
  ): Promise<void> {
    const opening = <IOpenSchedule | undefined>(
      await this.basicQuery().where({ status: EOpenScheduleStatus.New }).orderBy('id', 'asc').limit(0).first()
    );
    if (opening) {
      const tx = await this.getKnex().transaction();
      try {
        logger.info(`Trying to issue: ${opening.numberOfBox} loot boxes for ${opening.owner}`);
        const txResult = await contractCallback(opening.campaignId, opening.owner, opening.numberOfBox);
        // Update status and update transaction hash
        await tx(this.tableName)
          .update(<Partial<IOpenSchedule>>{ status: EOpenScheduleStatus.Opened, transactionHash: txResult.hash })
          .where({ id: opening.id });
        await tx.commit();
      } catch (err) {
        await tx.rollback();
        // Update status and update transaction hash
        logger.error(err);
        await this.getDefaultKnex()
          .update(<Partial<IOpenSchedule>>{ status: EOpenScheduleStatus.Error })
          .where({ id: opening.id });
        throw err;
      }
    } else {
      logger.info('We run out of schedule to open loot boxes');
    }
  }

  // Perform batch buy based on recored event
  public async batchBuy(
    event: IEventDetail,
    records: Pick<IOpenSchedule, 'campaignId' | 'numberOfBox' | 'owner' | 'memo'>[],
  ): Promise<void> {
    const tx = await this.getKnex().transaction();
    try {
      for (let i = 0; i < records.length; i += 1) {
        await tx(this.tableName).insert(records[i]);
      }
      // Update status to successed
      await tx('event').update({ status: EProcessingStatus.Success }).where({ id: event.id });
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      await this.getKnex()('event').update({ status: EProcessingStatus.Error }).where({ id: event.id });
      throw err;
    }
  }
}

export default ModelOpenSchedule;
