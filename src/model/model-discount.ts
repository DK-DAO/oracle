import { Knex } from 'knex';
import { objectToCondition } from '../helper/utilities';
import { ModelBase } from './model-base';

export interface IDiscount {
  id: number;
  campaignId: number;
  address: string;
  discount: number;
  memo: string;
  createdDate: string;
}

export type TKeyOfConfig = 'activeChainId' | 'earlyBird' | 'dkdaoRng' | 'dkDistributor';

export class ModelDiscount extends ModelBase<IDiscount> {
  constructor() {
    super('discount');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async getDiscountByAddress(address: string): Promise<number> {
    const [result] = await this.basicQuery().where({ address });
    if (typeof result !== 'undefined' && typeof result.discount !== 'undefined') {
      return result.discount;
    }
    return 0;
  }

  public async insertIfNotExist(record: Partial<IDiscount>): Promise<IDiscount> {
    const [dbRecord] = await this.get(objectToCondition(record, 'address', 'campaignId'));
    if (typeof dbRecord === 'undefined') {
      const result = await this.create(record);
      if (typeof result !== 'undefined') {
        return result;
      }
      throw new Error('We can not insert new discount record');
    }
    if (await this.update(record, objectToCondition(record, 'address', 'campaignId'))) {
      return { ...dbRecord, ...record };
    }
    throw new Error('We can not update the discount record');
  }
}

export default ModelDiscount;
