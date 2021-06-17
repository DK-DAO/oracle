/**
 * Hex record ordering by
 * @export
 * @interface IOrderingBy
 */
export interface IOrderingBy {
  /**
   * Column name
   * @type {string}
   * @memberof IOrderingBy
   */
  column: string;

  /**
   * Record ordering
   * @type {IOrder}
   * @memberof IOrderingBy
   */
  order: TOrder;
}

export type TOrder = 'asc' | 'desc';

/**
 * Record pagination for list of records
 * @export
 * @interface IPagination
 */
export interface IPagination {
  /**
   * Total number of records
   * @type {number}
   * @memberof IPagination
   */
  total?: number;

  /**
   * Starting point of records to be queried
   * @type {number}
   * @memberof IPagination
   */
  offset: number;

  /**
   * Limited number of records
   * @type {number}
   * @memberof IPagination
   */
  limit: number;

  /**
   * Record ordering by column
   * @example ```ts {column: 'user_id', order: 'asc'} ```
   * @type {IOrderingBy[]}
   * @memberof IPagination
   */
  order: IOrderingBy[];
}

/**
 * Hex return list of records
 * @export
 * @interface IRecordList
 */
export interface IRecordList<T> extends IPagination {
  /**
   * Records of data
   * @type {T[]}
   * @memberof IRecordList
   */
  records: T[];
}

/**
 * Hex single record, could be any of keys-values object
 * @export
 * @interface IRecord
 */
export interface IRecord {
  [key: string]: any;
}

/**
 * Response for single record
 * @export
 * @interface IResponseRecord
 */
export interface IResponseRecord<T extends IRecord> {
  /**
   * Is re process success?
   * @type {boolean}
   * @memberof IResponseRecord
   */
  success: boolean;

  /**
   * Is this API, method is deprecated in the future
   * @type {boolean}
   * @memberof IResponseRecord
   */
  deprecated?: boolean;

  /**
   * Result of the data
   * @type {T extends IRecord}
   * @memberof IResponseRecord
   */
  result: T;
}

/**
 * Response for list of records
 * @export
 * @interface IResponseList
 */
export interface IResponseList<T> {
  /**
   * Is the process success?
   * @type {boolean}
   * @memberof IResponseList
   */
  success: boolean;

  /**
   * Is this API, method will be deprecated?
   * @type {boolean}
   * @memberof IResponseList
   */
  deprecated?: boolean;

  /**
   * Array of records that's matched the query
   * @type {IRecordList}
   * @memberof IResponseList
   */
  result: IRecordList<T>;
}

/**
 * Response for error
 * @export
 * @interface IResponseError
 */
export interface IResponseError {
  /**
   * Is the process success?
   * @type {boolean}
   * @memberof IResponseList
   */
  success: boolean;

  /**
   * Is this API, method will be deprecated?
   * @type {boolean}
   * @memberof IResponseList
   */
  deprecated?: boolean;

  /**
   * Error interface need to be response
   * @type {Error}
   * @memberof IResponseError
   */
  result: Error;
}

/**
 * Hex standardized response
 * @export
 * @interface IResponse
 */
export interface IResponse<T> {
  /**
   * Is the process success?
   * @type {boolean}
   * @memberof IResponse
   */
  success: boolean;

  /**
   * Is this API, method will be deprecated?
   * @type {boolean}
   * @memberof IResponse
   */
  deprecated?: boolean;

  /**
   * Common result in hex framework
   * @type {(Error| IRecord | IRecordList<T>)}
   * @memberof IResponse
   */
  result: Error | T | IRecordList<T>;
}
