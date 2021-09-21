/* eslint-disable no-await-in-loop */
import { ethers } from 'ethers';
import crypto from 'crypto';
import { Knex } from 'knex';
import { Utilities } from 'noqueue';
import { IResponseList, IPagination } from '../framework';
import { ModelBase } from './model-base';
import ModelEvent, { EProcessingStatus } from './model-event';
import logger from '../helper/logger';
import { BigNum } from '../helper/utilities';
import { calculateDistribution, calculateNumberOfLootBoxes } from '../helper/calculate-loot-boxes';
import config from '../helper/config';
import ModelDiscount from './model-discount';

export enum EOpenScheduleStatus {
  New = 0,
  Opening = 1,
  Opened = 2,
  ResultArrived = 3,
  Error = 255,
}

export interface IOpenSchedule {
  id: number;
  campaignId: number;
  issuanceId: number;
  numberOfBox: number;
  totalBoxes: number;
  eventId: number | null;
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
      'issuanceId',
      'numberOfBox',
      'totalBoxes',
      'transactionHash',
      'owner',
      'memo',
      'status',
      'updatedDate',
      'createdDate',
    );
  }

  public async getNextIssuanceId(): Promise<number> {
    const knex = this.getKnex();
    const result = await knex(this.tableName)
      .select(knex.raw('(IFNULL(MAX(`issuanceId`), 0) + 1) AS nextIssuanceId'))
      .first();
    return result.nextIssuanceId || 0;
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
        logger.info(`Trying to issue: ${opening.numberOfBox} loot boxes for ${opening.owner}, id: ${opening.id}`);
        const txResult = await Utilities.TillSuccess<ethers.ContractTransaction>(async () => {
          return contractCallback(opening.campaignId, opening.owner, opening.numberOfBox);
        });
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

  public async getScheduling(
    pagination: IPagination = { offset: 0, limit: 20, order: [] },
    conditions?: {
      field: keyof IOpenSchedule;
      operator?: '=' | '>' | '<' | '>=' | '<=';
      value: string | number;
    }[],
  ): Promise<IResponseList<IOpenSchedule>> {
    return this.getListByCondition<IOpenSchedule>(this.attachConditions(this.basicQuery(), conditions), pagination);
  }

  // Perform batch buy based on recorded event
  public async batchBuy(): Promise<void> {
    const imDiscount = new ModelDiscount();
    const imEvent = new ModelEvent();
    const issuanceId = await this.getNextIssuanceId();
    // Start transaction
    const tx = await this.getKnex().transaction();
    const event = await imEvent.getPaymentOrDonateEventDetail();

    // We will end the process if event is undefined
    if (typeof event === 'undefined') {
      await tx.rollback();
      return;
    }
    try {
      // Calculate number of loot boxes
      const floatVal = BigNum.fromHexString(event.value).div(BigNum.from(10).pow(event.tokenDecimal)).toNumber();
      let numberOfLootBoxes = 0;
      let discount = 0;

      // Issue boxes for donors
      if (event.status === EProcessingStatus.ProcessedDonate) {
        numberOfLootBoxes = Math.round(floatVal);
        discount = 0.8;
      } else {
        discount = await imDiscount.getDiscountByAddress(event.from);
        numberOfLootBoxes = calculateNumberOfLootBoxes(floatVal, discount);
      }

      logger.info(`Processing ${floatVal} for: ${event.from} discount: ${discount * 100}%`);

      if (!Number.isFinite(floatVal) || floatVal < 0 || numberOfLootBoxes <= 0) {
        throw new Error(`Unexpected result, value: ${floatVal}, No boxes ${numberOfLootBoxes}`);
      }
      // Calculate distribution of loot boxes

      const lootBoxDistribution = calculateDistribution(numberOfLootBoxes);
      logger.info(
        `Total number of loot boxes: ${numberOfLootBoxes} (${lootBoxDistribution}) for: ${event.from} discount: ${
          discount * 100
        }%`,
      );
      const records = lootBoxDistribution.map((item) => {
        return {
          campaignId: config.activeCampaignId,
          issuanceId,
          eventId: event.id,
          totalBoxes: numberOfLootBoxes,
          owner: event.from,
          memo: `${crypto.randomBytes(20).toString('hex')} buy ${numberOfLootBoxes} boxes with ${floatVal.toFixed(2)} ${
            event.tokenSymbol
          }, from ${event.from}`,
          numberOfBox: item,
        };
      });
      for (let i = 0; i < records.length; i += 1) {
        await tx(this.tableName).insert(records[i]);
      }
      // Update status to succeed
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
