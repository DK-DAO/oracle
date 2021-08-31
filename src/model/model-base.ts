import { Knex } from 'knex';
import { ModelMySQL, Pagination, IPagination, IResponseList } from '../framework';
import logger from '../helper/logger';

export class ModelBase<T> extends ModelMySQL {
  protected basicQuery?(): Knex.QueryBuilder;

  // eslint-disable-next-line class-methods-use-this
  protected attachConditions(
    ik: Knex.QueryBuilder,
    conditions?: {
      field: keyof T;
      operator?: '=' | '>' | '<' | '>=' | '<=';
      value: string | number;
    }[],
  ): Knex.QueryBuilder {
    if (typeof conditions !== 'undefined' && Array.isArray(conditions) && conditions.length > 0) {
      for (let i = 0; i < conditions.length; i += 1) {
        const { field, operator, value } = conditions[i];
        if (operator) {
          ik.where(<string>field, operator, value);
        } else {
          ik.where(<string>field, value);
        }
      }
    }
    return ik;
  }

  public async create(data: Partial<T>): Promise<T | undefined> {
    let result;
    try {
      await this.getDefaultKnex().insert(data);
      if (typeof this.basicQuery === 'undefined') {
        throw Error('Basic query was undefined');
      }
      result = this.basicQuery().whereRaw('`id`=LAST_INSERT_ID()').first();
    } catch (err) {
      logger.error(err);
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
      await this.attachConditions(this.getDefaultKnex().update(data), conditions);
    } catch (err) {
      success = true;
      logger.error(err);
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
    return this.attachConditions(this.basicQuery(), conditions);
  }

  public async isExist(key: keyof T, value: any): Promise<boolean> {
    const [result] = await this.getDefaultKnex().count('id', { as: 'total' }).where(key, value);
    return result && result.total > 0;
  }

  public async isNotExist(key: keyof T, value: any): Promise<boolean> {
    return !(await this.isExist(key, value));
  }

  /**
   * Get list of records by simple conditions
   */
  // eslint-disable-next-line class-methods-use-this
  protected async getListByCondition<V>(
    query: Knex.QueryBuilder,
    pagination: IPagination = { offset: 0, limit: 20, order: [] },
  ): Promise<IResponseList<V>> {
    return {
      success: true,
      result: await Pagination.pagination<V>(query, pagination),
    };
  }
}

export default ModelBase;
