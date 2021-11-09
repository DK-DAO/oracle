import { Knex } from 'knex';
import { ModelMysqlBasic } from '@dkdao/framework';
import config from '../helper/config';

export interface INonceManagement {
  id: number;
  address: string;
  nonce: number;
  createdDate: string;
}

export class ModelNonceManagement extends ModelMysqlBasic<INonceManagement> {
  constructor() {
    super(config.table.nonceManagement);
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  async setNonce(address: string, nonce: number) {
    if (await this.isNotExist('address', address)) {
      await this.create({
        address,
        nonce,
      });
    } else {
      await this.update(
        {
          address,
          nonce,
        },
        [
          {
            field: 'address',
            value: address,
          },
        ],
      );
    }
  }

  async getNonce(address: string): Promise<number> {
    const [result] = await this.get([
      {
        field: 'address',
        value: address,
      },
    ]);
    if (typeof result !== 'undefined' && Number.isFinite(result.nonce)) {
      return result.nonce;
    }
    return 0;
  }

  async increaseNonce(address: string) {
    const nonce = await this.getNonce(address);
    await this.setNonce(address, nonce + 1);
  }
}

export default ModelNonceManagement;
