import { Knex } from 'knex';
import { ModelBase } from './model-base';

export interface IToken {
  id: number;
  blockchainId: number;
  name: string;
  address: string;
  symbol: string;
  decimal: number;
  createdDate: string;
}

export class ModelToken extends ModelBase<IToken> {
  constructor() {
    super('token');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('id', 'blockchainId', 'name', 'symbol', 'decimal', 'address', 'createdDate');
  }
}

export default ModelToken;
