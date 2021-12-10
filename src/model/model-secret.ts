/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';
import { Utilities } from 'noqueue';
import { ModelMysqlBasic, Transaction } from '@dkdao/framework';
import logger from '../helper/logger';
import config from '../helper/config';

export enum ESecretStatus {
  New = 0,
  Committed = 1,
  Revealed = 2,
  Error = 255,
}

export interface ISecret {
  id: number;
  blockchainId: number;
  secret: string;
  digest: string;
  status: ESecretStatus;
  createdDate: string;
  updatedDate: string;
}

export class ModelSecret extends ModelMysqlBasic<ISecret> {
  constructor() {
    super(config.table.secret);
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async updateAll(updateData: Partial<ISecret>, idList: number[]) {
    return this.getDefaultKnex().update(updateData).whereIn('id', idList);
  }

  // Make sure that secrets will be inserted to database one by one
  public async batchCommit(
    records: Pick<ISecret, 'secret' | 'digest'>[],
    contractCallback: () => Promise<void>,
  ): Promise<void> {
    await Transaction.getInstance()
      .process(async (tx: Knex.Transaction) => {
        for (let i = 0; i < records.length; i += 1) {
          await tx(this.tableName).insert(records[i]);
          // const { id } = await tx(this.tableName).select('id').whereRaw('`id`=LAST_INSERT_ID()').first();
        }
        await Utilities.TillSuccess(async () => contractCallback());
      })
      .catch(async (error: Error) => {
        logger.error('Can not open loot boxes', error);
      })
      .exec();
  }

  public async getDigest(): Promise<ISecret | undefined> {
    return <ISecret | undefined>(
      await this.basicQuery().where({ status: ESecretStatus.Committed }).orderBy('id', 'asc').limit(0).first()
    );
  }

  public async countDigest(): Promise<number> {
    return ((await this.getDefaultKnex().count('id as total').where({ status: 1 }).first()) || { total: 0 }).total;
  }
}

export default ModelSecret;
