import { Knex } from 'knex';
import { ModelBase } from './model-base';

export interface IWatching {
  id: number;
  blockchainId: number;
  name: string;
  address: string;
  createdDate: string;
}

export class ModelWatching extends ModelBase<IWatching> {
  constructor() {
    super('watching');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('id', 'blockchainId', ' name', 'address', 'createdDate');
  }
}

export default ModelWatching;
