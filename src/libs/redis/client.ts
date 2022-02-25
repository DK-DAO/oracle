import { Singleton } from '@dkdao/framework';
import redis from 'redis'
import config from '../../helper/config';

class RedisClient {
  private redisClient: redis.RedisClient;

  constructor(redisUrl: string) {
    this.redisClient = redis.createClient(redisUrl);
    this.redisClient.on("error", function (err) {
      console.error("Error connecting to redis", err);
    });
  }

  public get(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      return this.redisClient.get(key, (err, value) => {
        if (err) {
          return reject(err);
        }
        return resolve(value);
      });
    });
  }

  public set(key: string, value: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      return this.redisClient.set(key, value, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve(true);
      });
    });
  }

  public getTtl(key: string): Promise<number> {
    return new Promise((resolve, reject) => {
      return this.redisClient.ttl(key, (err, seconds) => {
        if (err) {
          return reject(err);
        }
        return resolve(seconds);
      });
    });
  }

  public setEx(key: string, value: string, seconds: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      return this.redisClient.setex(key, seconds, value, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve(true);
      });
    });
  }

  public delete(key: string | string[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      return this.redisClient.del(key, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve(true);
      });
    });
  }

  public listPush(key: string, value: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      return this.redisClient.lpush(key, value, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve(true);
      });
    });
  }

  public listRemoveItem(key: string, value: string): Promise<number> {
    return new Promise((resolve, reject) => {
      return this.redisClient.lrem(key, 0, value, (err, count) => {
        if (err) {
          return reject(err);
        }
        return resolve(count);
      });
    });
  }

  public listGetAll(key: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      return this.redisClient.lrange(key, 0, -1, (err, value) => {
        if (err) {
          return reject(err);
        }
        return resolve(value);
      });
    });
  }
}

export const RedisInstance = Singleton<RedisClient>('redis-client', RedisClient, config.redisConnectUrl);
export default RedisInstance;
