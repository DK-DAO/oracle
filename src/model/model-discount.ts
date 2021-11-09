import { Knex } from 'knex';
import { ModelMysqlBasic } from '@dkdao/framework';
import config from '../helper/config';

export interface IDiscount {
  id: number;
  phase: number;
  address: string;
  discount: number;
  code: string;
  memo: string;
  createdDate: string;
  updatedDate: string;
}

export class ModelDiscount extends ModelMysqlBasic<IDiscount> {
  constructor() {
    super(config.table.discount);
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
}

export default ModelDiscount;
