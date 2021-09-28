import { IPagination, IResponse, ModelMysqlBasic, Transaction } from '@dkdao/framework';
import { Knex } from 'knex';
import logger from '../helper/logger';
import { BigNum } from '../helper/utilities';
import { IEventDetail, EProcessingStatus } from './model-event';

export interface IAirdrop {
  id: number;
  owner: string;
  value: string;
  createdDate: string;
}

export class ModelAirdrop extends ModelMysqlBasic<IAirdrop> {
  constructor() {
    super('airdrop');
  }

  public async batchProcessEvent(event: IEventDetail) {
    await Transaction.getInstance()
      .process(async (tx: Knex.Transaction) => {
        const airdrop = <IAirdrop | undefined>await tx(this.tableName).select('*').where({ owner: event.from }).first();
        const floatVal = BigNum.fromHexString(event.value).div(BigNum.from(10).pow(event.tokenDecimal));
        // If existed we update it otherwise we create a new one
        if (typeof airdrop !== 'undefined') {
          // Calculate float value, we will store in float string
          await tx(this.tableName)
            .update({
              value: BigNum.from(airdrop.value).plus(floatVal).toString(),
            })
            .where({ owner: event.from });
        } else {
          await tx(this.tableName).insert(<IAirdrop>{
            owner: event.from,
            value: floatVal.toString(),
          });
        }
        await tx('event').update({ status: EProcessingStatus.ProcessedDonate }).where({ id: event.id });
        await tx.commit();
      })
      .catch(async (error: Error) => {
        logger.error('Can process events', error);
        await this.getKnex()('event').update({ status: EProcessingStatus.Error }).where({ id: event.id });
      })
      .exec();
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async getDonateBalanceList(
    pagination: IPagination = { offset: 0, limit: 20, order: [] },
  ): Promise<IResponse<IAirdrop>> {
    return this.getListByCondition<IAirdrop>(this.basicQuery(), pagination);
  }
}

export default ModelAirdrop;
