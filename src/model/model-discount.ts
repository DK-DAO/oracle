import { Knex } from 'knex';
import { ModelMysqlBasic } from '@dkdao/framework';

export interface IDiscount {
  id: number;
  campaignId: number;
  address: string;
  discount: number;
  code: string;
  memo: string;
  createdDate: string;
}

export type TKeyOfConfig = 'activeChainId' | 'earlyBird' | 'dkdaoRng' | 'dkDistributor';

export class ModelDiscount extends ModelMysqlBasic<IDiscount> {
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
}

export default ModelDiscount;
