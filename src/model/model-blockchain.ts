import { Knex } from 'knex';
import { ModelMysqlBasic } from '@dkdao/framework';
import config from '../helper/config';

export interface IBlockchain {
  id: number;
  chainId: number;
  nativeToken: string;
  explorerUrl: string;
  name: string;
  url: string;
  safeConfirmation: number;
  numberOfSyncBlock: number;
  numberOfProcessBlock: number;
  createdDate: string;
  updatedDate: string;
}

export class ModelBlockchain extends ModelMysqlBasic<IBlockchain> {
  constructor() {
    super(config.table.blockchain);
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async getAllPossibleBlockchain(): Promise<IBlockchain[]> {
    return this.basicQuery().whereNot({ url: '' });
  }
}

export default ModelBlockchain;
