import { Knex } from 'knex';
import { ModelBase } from './model-base';

export interface IBlockchain {
  id: number;
  chainId: number;
  nativeToken: string;
  explorerUrl: string;
  name: string;
  url: string;
  safeConfirmations: number;
  numberOfBlocksToSync: number;
  numberOfBlocksToWorker: number;
  createdDate: string;
}

export class ModelBlockchain extends ModelBase<IBlockchain> {
  constructor() {
    super('blockchain');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }
}

export default ModelBlockchain;
