import { Knex } from 'knex';
import { ModelMySQL } from '../framework';
import logger from '../helper/logger';

export class ModelBase<T> extends ModelMySQL {
  protected basicQuery?(): Knex.QueryBuilder;

  public async create(data: Partial<T>): Promise<T | undefined> {
    let result;
    try {
      await this.lock();
      await this.getDefaultKnex().insert(data);
      if (typeof this.basicQuery === 'undefined') {
        throw Error('Basic query was undefined');
      }
      result = this.basicQuery().whereRaw('`id`=LAST_INSERT_ID()').first();
    } catch (err) {
      logger.error(err);
    } finally {
      await this.unlock();
    }
    return result;
  }

  public async update(
    data: Partial<T>,
    conditions?: {
      field: keyof T;
      operator?: '=' | '>' | '<' | '>=' | '<=';
      value: string | number;
    }[],
  ): Promise<boolean> {
    let success: boolean = true;
    try {
      await this.lock();
      if (typeof conditions !== 'undefined' && Array.isArray(conditions) && conditions.length > 0) {
        await this.getDefaultKnex().update(data).where(conditions);
      } else {
        await this.getDefaultKnex().update(data);
      }
    } catch (err) {
      success = true;
      logger.error(err);
    } finally {
      await this.unlock();
    }
    return success;
  }

  public async get(
    conditions?:
      | {
          field: keyof T;
          operator?: '=' | '>' | '<' | '>=' | '<=';
          value: string | number;
        }[],
  ): Promise<T[]> {
    if (typeof this.basicQuery === 'undefined') {
      throw Error('Basic query was undefined');
    }
    return typeof conditions !== 'undefined' && Array.isArray(conditions) && conditions.length > 0
      ? this.basicQuery().where(conditions)
      : this.basicQuery();
  }
}

export default ModelBase;
