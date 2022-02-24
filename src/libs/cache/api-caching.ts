import { Singleton } from "@dkdao/framework";
import config from "../../helper/config";
import logger from '../../helper/logger';
import { RedisInstance } from '../redis/client';

type CachingKeyCluster = {
    url?: string
    params?: object
}
type CachingKey = string | CachingKeyCluster

class ApiCaching {
    private rootPath: string;
    private defaultExpire: number;

    constructor(rootPath: string) {
        this.rootPath = rootPath
        this.defaultExpire = 300
    }

    /**
     * key format: {this.rootPath}-url:{api-url}-params:{base64(params)}
     */
    private keyHash(key: CachingKey): string {
        if (typeof key === 'string') return key
        const paramsBase64 = Buffer.from(JSON.stringify(key.params)).toString('base64');
        const keyStr = this.rootPath + '-url:' + key.url + "-params:" + paramsBase64;
        return keyStr;
    }

    public saveCache(key: CachingKey, value: any, expireTime: number = this.defaultExpire) {
        logger.info(`[Cache] Set cache: ${JSON.stringify(key)} | with value: ${JSON.stringify(value)}`)
        return RedisInstance.setEx(this.keyHash(key), JSON.stringify(value), expireTime)
    }

    public async getCache(key: CachingKey) {
        try {
            logger.info(`[Cache] Getting cache: ${JSON.stringify(key)}`)
            const result = await RedisInstance.get(this.keyHash(key))
            if (result) {
                logger.info(`[Cache] Hit cache: ${JSON.stringify(key)} | with value: ${result}`)
                return JSON.parse(result)
            }
            logger.info(`[Cache] Cache missed: ${JSON.stringify(key)}`)
            return result
        } catch (error) {
            logger.info(`[getCache] Error: ${error}`)
        }
    }

    public async saveCacheAndReturn(key: CachingKey, value: any, expireTime: number = this.defaultExpire) {
        try {
            this.saveCache(key, value, expireTime)
            return value;
        } catch (error) {
            logger.info(`[saveCacheAndReturn] Error: ${error}`)
        }
    }

    public async getKeyAndCache(key: CachingKey) {
        const keyHash = this.keyHash(key)
        const result = await this.getCache(key);
        return [keyHash, result]
    }
}

export const CachingInstance = Singleton<ApiCaching>(
    'api-caching',
    ApiCaching,
    config.redisCachePath,
    config.redisCachePath
);
export default CachingInstance;
