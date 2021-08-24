import { Knex } from 'knex';
import { ModelBase } from './model-base';

export interface IDiscount {
  id: number;
  campaignId: number;
  address: string;
  discount: number;
  noBoxes: number;
  code: string;
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

  public async getDiscountByAddress(address: string): Promise<IDiscount | undefined> {
    const [result] = await this.basicQuery().orderBy('id', 'desc').limit(1).where({ address });
    return result;
  }
}

export default ModelDiscount;
