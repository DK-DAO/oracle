/**
 * Model conditions
 * @export
 * @interface IModelCondition
 */
export interface IModelCondition {
  /**
   * Field name
   * @type {string}
   * @memberof IModelCondition
   */
  field: string;

  /**
   * Operator to compare this field with the value,
   * default is =
   * @type {string}
   * @memberof IModelCondition
   */
  operator?: '>' | '<' | '<=' | '>=';

  /**
   * Value need to be compared
   * @type {*}
   * @memberof IModelCondition
   */
  value: string | number;
}

/**
 * Lock enum could be WRITE, READ
 * @export
 * @enum {string}
 */
export enum EModelLock {
  write = 'WRITE',
  read = 'READ',
}
