import { Knex } from 'knex';
import { ModelMysqlBasic } from '@dkdao/framework';

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

export class ModelBlockchain extends ModelMysqlBasic<IBlockchain> {
  constructor() {
    super('blockchain');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async getAllPossibleBlockchain(): Promise<IBlockchain[]> {
    return this.basicQuery().whereNot({ url: '' });
  }
}

export default ModelBlockchain;
