import { Knex } from 'knex';
import { ModelMysqlBasic } from '@dkdao/framework';

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
}

export class ModelWatching extends ModelMysqlBasic<IWatching> {
  constructor() {
    super('watching');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }
}

export default ModelWatching;
