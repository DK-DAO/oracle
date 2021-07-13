/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';
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
  public async batchCommit(records: Pick<ISecret, 'secret' | 'digest'>[]): Promise<number[] | undefined> {
    const tx = await this.getKnex().transaction();
    const result: number[] = [];
    try {
      for (let i = 0; i < records.length; i += 1) {
        await tx(this.tableName).insert(records[i]);
        const { id } = await tx(this.tableName).select('id').whereRaw('`id`=LAST_INSERT_ID()').first();
        if (Number.isInteger(id)) {
          result.push(id);
        } else {
          throw new Error('Unable to insert a record to secret table');
        }
      }
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
    return result;
  }

  public async getDigest(): Promise<ISecret | undefined> {
    return <ISecret | undefined>(
      await this.basicQuery().where({ status: ESecretStatus.Committed }).orderBy('id', 'asc').limit(0).first()
    );
  }
}

export default ModelSecret;
