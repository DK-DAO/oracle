import { EventEmitter } from 'events';
import { Knex } from 'knex';
import { IResponseList, IPagination, EModelLock, IModelCondition } from './interfaces';
import { Connector } from './connector';
import { Pagination } from './pagination';

/**
 * @event
 * @memberof [[ModelMySQL]]
 */
export type TMysqlModelEvent = 'table-lock' | 'table-unlock';

/**
 * [[include: hex-mysql-model-001.md]]
 * @class ModelMySQL
 * @extends {EventEmitter}
 * @export [[ModelMySQL]]
 */
export class ModelMySQL extends EventEmitter {
  /**
   * The default table name that has related
   * to this model
   * @protected
   * @type {string}
   * @memberof [[ModelMySQL]]
   */
  protected tableName: string;

  /**
   * Default knex instance
   * @private
   * @type {*}
   * @memberof ModelMySQL
   */
  private knexInstance: Knex<any, any[]>;

  /**
   * Creates an instance of ModelMySQL.
   * @param {string} tableName Default table of this model
   * @param {string} [dbInstanceName='__default__'] Alias of database instance
   * @memberof [[ModelMySQL]]
   */
  constructor(tableName: string, dbInstanceName: string = '__default__') {
    super();
    this.tableName = tableName;
    this.knexInstance = Connector.getInstance(dbInstanceName);
  }

  /**
   * Insert ignore
   * @protected
   * @todo Remove this method after knex.js got native insert ignore
   * @param {Knex.QueryBuilder} queryBuilder
   * @return {Promise<Knex.QueryBuilder>}
   * @memberof ModelMySQL
   */
  protected async insertIgnore(queryBuilder: Knex.QueryBuilder): Promise<Knex.QueryBuilder> {
    return this.getKnex().raw(queryBuilder.toString().replace(/insert/i, 'INSERT IGNORE'));
  }

  /**
   * Get knex instance
   * @returns {Knex<any, any[]>}
   * @memberof [[ModelMySQL]]
   */
  public getKnex(): Knex<any, any[]> {
    return this.knexInstance;
  }

  /**
   * Get Knex instance of ModelMySQL
   * @returns {Knex.QueryBuilder<any, any>}
   * @memberof [[ModelMySQL]]
   */
  public getDefaultKnex(): Knex.QueryBuilder<any, any> {
    return this.knexInstance(this.tableName);
  }

  /**
   * Lock current table of this model
   * @todo Support timeout to make sure table won't be lock for so long
   * @param {EModelLock} [mode=EModelLock.write] Lock type
   * @returns
   * @memberof [[ModelMySQL]]
   */
  public async lock(mode: EModelLock = EModelLock.write) {
    const result = await this.getKnex().raw(`LOCK TABLES ${this.tableName} ${mode}`);
    this.emit('table-lock', this.tableName, mode);
    return result;
  }

  /**
   * Unlock all locked table
   * @returns
   * @memberof [[ModelMySQL]]
   */
  public async unlock() {
    const result = await this.getKnex().raw('UNLOCK TABLES');
    this.emit('table-unlock', this.tableName);
    return result;
  }

  /**
   * Get list of records by simple conditions
   * @protected
   * @param {string[]} selectFields Fields will be returned after process
   * @param {IModelCondition[]} [conditions=[]] Conditions to query data from database
   * @param {IPagination} pagination Pagination example
   * @returns {Promise<IResponseList>}
   * @memberof [[ModelMySQL]]
   */
  protected async getListByCondition<T>(
    selectFields: string[],
    conditions: IModelCondition[] = [],
    pagination: IPagination = { offset: 0, limit: 20, order: [] },
  ): Promise<IResponseList<T>> {
    const query = this.getDefaultKnex().select(selectFields);
    for (let i = 0; i < conditions.length; i += 1) {
      const { field, operator, value } = conditions[i];
      if (operator) {
        query.where(field, operator, value);
      } else {
        query.where(field, '=', value);
      }
    }
    return {
      success: true,
      result: await Pagination.pagination<T>(query, pagination),
    };
  }

  public async isExist(key?: string, value?: any): Promise<boolean> {
    const query = this.getDefaultKnex().count('*', { as: 'total' });
    if (typeof key !== 'undefined' && typeof key !== 'undefined') {
      query.where(key, value);
    }
    const [result] = await query;
    return result && result.total > 0;
  }

  public async isNotExist(key?: string, value?: any): Promise<boolean> {
    return !(await this.isExist(key, value));
  }
}

export default ModelMySQL;
