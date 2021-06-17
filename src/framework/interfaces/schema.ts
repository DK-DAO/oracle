/**
 * Request data interface
 * @export
 * @interface IRequestData
 */
export interface IRequestData {
  body: any;
  query: any;
  params: any;
  any: any;
}

export type TDataType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export type TVarLocation = 'params' | 'query' | 'body' | 'any';

/**
 * Field in HexSchema
 * @export
 * @interface IField
 */
export interface IField {
  /**
   * Location of variable
   * @type {VarLocation}
   * @memberof IField
   */
  location: TVarLocation;

  /**
   * Name of field
   * @type {string}
   * @memberof IField
   */
  name: string;

  /**
   * Enum for DataType.enum
   * @type {any[]}
   * @memberof IField
   */
  enum?: any[];

  /**
   * Data type
   * @type {DataType}
   * @memberof IField
   */
  type: TDataType;

  /**
   * Validate function
   * @type {Function}
   * @memberof IField
   */
  validator?: Function;

  /**
   * Add pre process after value was checked
   * @type {Function}
   * @memberof IField
   */
  modifier?: Function;

  /**
   * Is this field required
   * @type {boolean}
   * @memberof IField
   */
  require?: boolean;

  /**
   * Default value
   * @type {*}
   * @memberof IField
   */
  default?: any;

  /**
   * Message in case of error
   * @type {string}
   * @memberof IField
   */
  message?: string;
}
