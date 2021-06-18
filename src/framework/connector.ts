import knex, { Knex } from 'knex';
import { EventEmitter } from 'events';
import { URL } from 'url';

export class Connector {
  /**
   * And mapping of keys and database instances
   * @private
   * @static
   * @type {{ [key: string]: Knex<any, any[]> }}
   * @memberof [[Connector]]
   */
  private static dbInstance: { [key: string]: Knex<any, any[]> } = {};

  /**
   * Prevent **setInterval()** from overlap
   * @private
   * @static
   * @todo Remove this variable after Knex support mechanism to maintenance connection pool
   * @type {boolean}
   * @memberof [[Connector]]
   */
  private static pingLock: boolean = false;

  /**
   * This one is a hot fix, it publish events to application layer
   * @static
   * @todo Remove this event after Knex support mechanism to maintenance connection pool
   * @type {EventEmitter}
   * @memberof [[Connector]]
   */
  public static pingEvent: EventEmitter;

  /**
   * Connect to the database by using Knex's config
   * @static
   * @param {DbConfig} DbConfig Database configuration
   * @param {string} [instanceName='__default__'] An alias of database instance
   * @returns {Knex<any, any[]>}
   * @memberof [[Connector]]
   */
  public static connect(dbConfig: Knex.Config, instanceName: string = '__default__'): Knex<any, any[]> {
    if (!Connector.dbInstance[instanceName]) {
      Connector.dbInstance[instanceName] = knex(dbConfig);
    }
    return Connector.getInstance(instanceName);
  }

  /**
   * Parse URL
   * @static
   * @param {string} inputURL
   * @return {*}  {Knex.Config}
   * @memberof Connector
   */
  public static parseURL(inputURL: string): Knex.Config {
    const myURL = new URL(inputURL);
    return {
      client: myURL.protocol.replace(/[:]/gi, ''),
      connection: {
        host: myURL.hostname,
        port: parseInt(myURL.port, 10),
        user: myURL.username,
        password: myURL.password,
        database: myURL.pathname.replace(/[/\s]/gi, ''),
      },
    };
  }

  /**
   * Connect to database by using friendly URL
   * @static
   * @param {string} url
   * @param {string} [instanceName='__default__']
   * @returns {Knex<any, any[]>}
   * @memberof [[Connector]]
   */
  public static connectByUrl(inputURL: string, instanceName: string = '__default__'): Knex<any, any[]> {
    return Connector.connect(Connector.parseURL(inputURL), instanceName);
  }

  /**
   * Get instance of database by db instance name
   * @static
   * @param {string} [instanceName='__default__'] Database instance name
   * @returns {Knex<any, any[]>} Knex database instance
   * @memberof [[Connector]]
   */
  public static getInstance(instanceName: string = '__default__'): Knex<any, any[]> {
    return Connector.dbInstance[instanceName];
  }

  /**
   * It's a dirty patch, I'm sorry to write this code
   * It isn't the best one but at least it works
   * @todo Remove this method after Knex support mechanism to maintenance connection pool
   * @static
   * @param {interval} [interval=30000] interval to repeat ping database
   * @memberof [[Connector]]
   */
  public static startPing(interval: number = 30000) {
    if (!Connector.pingLock) {
      Connector.pingEvent = new EventEmitter();
      Connector.pingEvent.on('ping', () => undefined);
      Connector.pingEvent.on('error', () => undefined);
      setInterval(() => {
        const instanceNames = Object.keys(Connector.dbInstance);
        instanceNames.forEach((instanceName: string) => {
          Connector.ping(instanceName).then(
            (result: any) => {
              Connector.pingEvent.emit('ping', instanceName, result);
            },
            (error: any) => {
              Connector.pingEvent.emit('error', instanceName, error);
            },
          );
        });
      }, interval);
      // No more new instance of ping
      Connector.pingLock = true;
    }
  }

  /**
   * A part of connection pool hot fix for maria database
   * @private
   * @static
   * @todo Remove this method after Knex support mechanism to maintenance connection pool
   * @param {string} instance
   * @returns {(Promise<string | undefined>)}
   * @memberof Connector
   */
  private static async ping(instance: string): Promise<string | undefined> {
    const k: Knex<any, any[]> = Connector.getInstance(instance);
    const executeSuccess = await k.select(k.raw('NOW() AS `pingAt`'));
    return executeSuccess.pop();
  }
}

export default Connector;
