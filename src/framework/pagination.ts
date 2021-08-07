import { Knex } from 'knex';
import { IPagination, IRecordList } from './interfaces';
import { Validator } from './validator';

/**
 * @export [[Pagination]]
 * @class Pagination
 */
export class Pagination {
  public static async countTotal(knexQuery: Knex.QueryBuilder<any, any>): Promise<number> {
    const totalResult = await knexQuery.clone().clearSelect().count('* as total').first();
    return typeof totalResult === 'undefined' || !totalResult.total ? 0 : totalResult.total;
  }

  public static async pagination<T>(
    knexQuery: Knex.QueryBuilder<any, any>,
    pagination: IPagination,
  ): Promise<IRecordList<T>> {
    const total = await Pagination.countTotal(knexQuery);
    const query = knexQuery.clone();
    const { order, offset, limit } = pagination;
    // Set offset
    if (Number.isInteger(offset)) {
      query.offset(offset);
    }
    // Set limit
    if (Number.isInteger(limit)) {
      query.limit(limit);
    }
    // Set order
    if (order && Array.isArray(order) && order.length > 0) {
      query.orderBy(order);
    }
    return {
      total,
      offset,
      limit,
      order,
      records: <T[]>await query,
    };
  }

  /**
   * Pagination schema
   * @public
   * @memberof Pagination
   */
  public static paginationSchema = new Validator(
    {
      location: 'any',
      name: 'offset',
      type: 'integer',
      defaultValue: 0,
    },
    {
      location: 'any',
      name: 'limit',
      type: 'integer',
      defaultValue: 20,
    },
    {
      location: 'any',
      name: 'order',
      type: 'array',
      defaultValue: [],
    },
  );
}

export default Pagination;
