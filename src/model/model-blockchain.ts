import { Knex } from 'knex';
import { ModelBase } from './model-base';

export interface IBlockchain {
  id: number;
  name: string;
  url: string;
  createdDate: string;
}

export class ModelBlockchain extends ModelBase<IBlockchain> {
  constructor() {
    super('sync');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('id', 'name', 'url', 'createdDate');
  }
}

export default ModelBlockchain;
