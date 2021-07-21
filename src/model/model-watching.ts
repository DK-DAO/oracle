import { Knex } from 'knex';
import { ModelBase } from './model-base';

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

export class ModelWatching extends ModelBase<IWatching> {
  constructor() {
    super('watching');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('id', 'blockchainId', 'type', ' name', 'address', 'createdDate');
  }
}

export default ModelWatching;
