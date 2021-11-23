import { Knex } from 'knex';
import { ModelMysqlBasic } from '@dkdao/framework';
import config from '../helper/config';

export enum EWatching {
  Payment = 0,
  Donate = 1,
}

export interface IWatching {
  id: number;
  blockchainId: number;
  type: EWatching;
  name: string;
  address: string;
  createdDate: string;
  updatedDate: string;
}

export class ModelWatching extends ModelMysqlBasic<IWatching> {
  constructor() {
    super(config.table.watching);
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public getPaymentBlockchainList() {
    return this.getKnex()(`${config.table.watching} as w`)
      .select('b.id', 'b.name', 'b.chainId')
      .join(`${config.table.blockchain} as b`, 'w.blockchainId', 'b.id')
      .groupBy('w.blockchainId');
  }
}

export default ModelWatching;
