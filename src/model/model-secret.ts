/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';
import { Utilities } from 'noqueue';
import { ModelBase } from './model-base';

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

export class ModelSecret extends ModelBase<ISecret> {
  constructor() {
    super('secret');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('id', 'blockchainId', 'secret', 'digest', 'createdDate', 'updatedDate');
  }

  public async updateAll(updateData: Partial<ISecret>, idList: number[]) {
    return this.getDefaultKnex().update(updateData).whereIn('id', idList);
  }

  // Make sure that secrets will be inserted to database one by one
  public async batchCommit(
    records: Pick<ISecret, 'secret' | 'digest'>[],
    contractCallback: () => Promise<void>,
  ): Promise<void> {
    const tx = await this.getKnex().transaction();
    try {
      for (let i = 0; i < records.length; i += 1) {
        await tx(this.tableName).insert(records[i]);
        // const { id } = await tx(this.tableName).select('id').whereRaw('`id`=LAST_INSERT_ID()').first();
      }
      await Utilities.TillSuccess(async () => {
        return contractCallback();
      });
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
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
