import { Knex } from 'knex';
import { BigNum } from '../helper/utilities';
import { ModelBase } from './model-base';
import { IEventDetail, EProcessingStatus } from './model-event';
import { IPagination, IResponseList, Pagination } from '../framework';

export interface IAirdrop {
  id: number;
  owner: string;
  value: string;
  createdDate: string;
}

export class ModelAirdrop extends ModelBase<IAirdrop> {
  constructor() {
    super('airdrop');
  }

  public async batchProcessEvent(event: IEventDetail) {
    const tx = await this.getKnex().transaction();
    try {
      const airdrop = <IAirdrop | undefined>await tx(this.tableName).select('*').where({ owner: event.from }).first();
      const floatVal = BigNum.fromHexString(event.value).div(BigNum.from(10).pow(event.tokenDecimal));
      // If existed we update it otherwise we create a new one
      if (typeof airdrop !== 'undefined') {
        // Caculate float value, we will store in float string
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
      await tx('event').update({ status: EProcessingStatus.Success }).where({ id: event.id });
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      await this.getKnex()('event').update({ status: EProcessingStatus.Error }).where({ id: event.id });
      throw err;
    }
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('id', 'owner', 'value', 'createdDate as createdDate');
  }

  public async getList(
    conditions: {
      field: keyof IAirdrop;
      operator?: '=' | '>' | '<' | '>=' | '<=';
      value: string | number;
    }[] = [],
    pagination: IPagination = { offset: 0, limit: 20, order: [] },
  ): Promise<IResponseList<IAirdrop>> {
    const query = this.basicQuery();
    for (let i = 0; i < conditions.length; i += 1) {
      const { field, operator, value } = conditions[i];
      if (operator) {
        query.where(field, operator, value);
      } else {
        query.where(field, '=', value);
      }
    }
    for (let i = 0; i < pagination.order.length; i += 1) {
      const { column, order } = pagination.order[i];
      query.orderBy(column, order);
    }
    return {
      success: true,
      result: await Pagination.pagination<IAirdrop>(query, pagination),
    };
  }
}

export default ModelAirdrop;
