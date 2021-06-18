/**
 * Router record
 * @export
 * @interface IRouterRecord
 */
export interface IRouterRecord {
  /**
   * HTTP method get, post, delete,...
   * @type {string}
   * @memberof IRouterRecord
   */
  method: string;

  /**
   * Router path, api path
   * @type {string}
   * @memberof IRouterRecord
   */
  path: string;

  /**
   * Name of handler defined in related service
   * @type {string}
   * @memberof IRouterRecord
   */
  handle: string;
}
