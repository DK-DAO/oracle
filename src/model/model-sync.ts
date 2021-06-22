import { Knex } from 'knex';
import { ModelBase } from './model-base';

export interface ISync {
  id: number;
  blockchainId: number;
  startBlock: number;
  syncedBlock: number;
  targetBlock: number;
  lastUpdate: string;
  createdDate: string;
}

export class ModelSync extends ModelBase<ISync> {
  constructor() {
    super('sync');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select(
      'id',
      'blockchainId',
      'startBlock',
      'syncedBlock',
      'targetBlock',
      'lastUpdate',
      'createdDate',
    );
  }
}

export default ModelSync;
