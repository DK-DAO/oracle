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
    super(config.table.discount, process.env.dbInstance || undefined);
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async getDiscountByAddress(address: string): Promise<IDiscount | undefined> {
    // @todo: Move config value to some where else
    const [result] = await this.basicQuery().where({ address, phase: config.activePhase });
    if (typeof result !== 'undefined' && typeof result.discount !== 'undefined') {
      return result;
    }
    return undefined;
  }
}

export default ModelDiscount;
