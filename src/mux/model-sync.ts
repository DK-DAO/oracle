import { HexMysqlModel } from 'hex-framework';
import { TransformerUtilities } from 'hex-utilities';

export interface ISync {
  id: number;
  startBlock: number;
  syncedBlock: number;
  targetBlock: number;
  lastUpdate: string;
}

export class ModelSync extends HexMysqlModel {
  constructor() {
    super('sync', 'mariadb/hex-eth-master-wallet');
  }

  public async addFirstRecord(): Promise<ISync | undefined> {
    // We need to call getDefaultKnex() every time
    // To make sure, it will create a new instance of builder
    // In fact, getDefaultKnex() is an alias of
    // let knex = this.getKnex();
    // knex(this.tableName).select()
    await this.getDefaultKnex().insert(
      TransformerUtilities.objectCaseToSnake(
        {
          startBlock: 0,
          syncedBlock: 0,
          targetBlock: 0,
        },
        0,
      ),
    );
    return this.getDefaultKnex()
      .select(
        'id',
        'start_block as startBlock',
        'synced_block as syncedBlock',
        'target_block as targetBlock',
        'last_update as lastUpdate',
      )
      .whereRaw('`id`=LAST_INSERT_ID()')
      .first();
  }

  public async update(id: number, data: Partial<ISync>): Promise<boolean> {
    await this.getDefaultKnex().update(TransformerUtilities.objectCaseToSnake(data)).where('id', id);
    return true;
  }

  public async getCurrentState(): Promise<ISync> {
    return this.getDefaultKnex()
      .select(
        'id',
        'start_block as startBlock',
        'synced_block as syncedBlock',
        'target_block as targetBlock',
        'last_update as lastUpdate',
      )
      .first();
  }
}

export default ModelSync;
