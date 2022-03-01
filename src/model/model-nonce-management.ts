import { Knex } from 'knex';
import { ModelMysqlBasic } from '@dkdao/framework';
import config from '../helper/config';
import { IBlockchain } from './model-blockchain';

export interface INonceManagement {
  id: number;
  blockchainId: number;
  address: string;
  nonce: number;
  createdDate: string;
}

export class ModelNonceManagement extends ModelMysqlBasic<INonceManagement> {
  private blockchain: IBlockchain;

  constructor(blockchain: IBlockchain) {
    super(config.table.nonceManagement, process.env.dbInstance || undefined);
    this.blockchain = blockchain;
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  async setNonce(address: string, nonce: number) {
    const nonces = await this.get([
      {
        field: 'address',
        value: address,
      },
      {
        field: 'blockchainId',
        value: this.blockchain.id,
      },
    ]);
    if (nonces.length === 0) {
      await this.create({
        blockchainId: this.blockchain.id,
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
