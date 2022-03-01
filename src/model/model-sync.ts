import { Knex } from 'knex';
import { ModelMysqlBasic } from '@dkdao/framework';
import config from '../helper/config';

export interface ISync {
  id: number;
  blockchainId: number;
  startBlock: number;
  syncedBlock: number;
  targetBlock: number;
  lastUpdate: string;
  createdDate: string;
}

export class ModelSync extends ModelMysqlBasic<ISync> {
  constructor() {
    super(config.table.sync, process.env.dbInstance || undefined);
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }
}

export default ModelSync;
