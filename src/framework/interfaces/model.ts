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
  operator?: string;

  /**
   * Value need to be compared
   * @type {*}
   * @memberof IModelCondition
   */
  value: any;
}

/**
 * Lock enum could be WRITE, READ
 * @export
 * @enum {string}
 */
export enum EHexModelLock {
  write = 'WRITE',
  read = 'READ',
}
