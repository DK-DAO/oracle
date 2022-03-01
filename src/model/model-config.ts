import { BigNumber } from 'ethers';
import { Knex } from 'knex';
import { ModelMysqlBasic } from '@dkdao/framework';
import config from '../helper/config';

export interface IConfig {
  id: number;
  key: string;
  type: string;
  value: Buffer;
  createdDate: string;
  updatedDate: string;
}

export type TKeyOfConfig = 'activeChainId' | 'dkDaoRng' | 'dkDistributor';

export class ModelConfig extends ModelMysqlBasic<IConfig> {
  constructor() {
    super(config.table.config, process.env.dbInstance || undefined);
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async getConfig(key: string): Promise<string | Buffer | number | BigNumber | boolean> {
    const { type, value } = <IConfig>await this.basicQuery().where({ key }).first();
    if (type === 'boolean') return value.toString() === 'true';
    if (type === 'string') return value.toString();
    if (type === 'number') return value.readUInt32BE(0);
    if (type === 'BigNumber') return BigNumber.from(`0x${value.toString('hex')}`);
    return value;
  }

  public async hasConfig(key: string): Promise<boolean> {
    const k = await this.getDefaultKnex().select('*').where({ key });
    return k.length > 0;
  }

  public async setConfig(key: string, value: string | Buffer | number | BigNumber | boolean): Promise<boolean> {
    const record = <IConfig>{};
    record.key = key;
    if (typeof value === 'boolean') {
      record.value = Buffer.from(value.toString());
      record.type = 'string';
    }
    if (typeof value === 'string') {
      record.value = Buffer.from(value);
      record.type = 'string';
    }
    if (typeof value === 'number') {
      const t = Buffer.alloc(4);
      t.writeUInt32BE(value, 0);
      record.value = t;
      record.type = 'number';
    }
    if (BigNumber.isBigNumber(value)) {
      record.value = Buffer.from(value.toHexString().replace(/^0x/i, ''), 'hex');
      record.type = 'number';
    }
    if (Buffer.isBuffer(value)) {
      record.value = value;
      record.type = 'Buffer';
    }

    try {
      if (await this.hasConfig(key)) {
        await this.create(record);
      } else {
        await this.update(record, [
          {
            field: 'key',
            value: key,
          },
        ]);
      }
      return true;
    } catch (err) {
      return false;
    }
  }
}

export default ModelConfig;
