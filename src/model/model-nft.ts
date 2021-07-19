import { Knex } from 'knex';
import { ModelBase } from './model-base';

export interface INft {
  id: number;
  blockchainId: number;
  name: string;
  symbol: string;
  address: string;
  createdDate: string;
}

export class ModelNft extends ModelBase<INft> {
  constructor() {
    super('nft');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }
}

export default ModelNft;
