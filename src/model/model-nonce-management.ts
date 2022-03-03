import { ethers } from 'ethers';
import { Knex } from 'knex';
import { Utilities } from 'noqueue';
import { ModelMysqlBasic } from '@dkdao/framework';
import config from '../helper/config';
import { IBlockchain } from './model-blockchain';
import { allowedSecondDiff } from '../helper/const';

export interface INonceManagement {
  id: number;
  blockchainId: number;
  address: string;
  nonce: number;
  createdDate: string;
  timeDiff: number;
}

export class ModelNonceManagement extends ModelMysqlBasic<INonceManagement> {
  private blockchainId: number;

  private provider: ethers.providers.Provider;

  constructor(blockchain: Pick<IBlockchain, 'id'>, provider: ethers.providers.Provider) {
    super(config.table.nonceManagement);
    this.blockchainId = blockchain.id;
    this.provider = provider;
  }

  public basicQuery(): Knex.QueryBuilder {
    const knex = this.getKnex();
    return this.getDefaultKnex().select(
      '*',
      knex.raw('(UNIX_TIMESTAMP(now()) - UNIX_TIMESTAMP(updatedDate)) AS `timeDiff`'),
    );
  }

  async setNonce(address: string, nonce: number) {
    const nonces = await this.get([
      {
        field: 'address',
        value: address,
      },
      {
        field: 'blockchainId',
        value: this.blockchainId,
      },
    ]);
    if (nonces.length === 0) {
      await this.create({
        blockchainId: this.blockchainId,
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

  async getNonceData(address: string): Promise<INonceManagement | undefined> {
    const [result] = await this.get([
      {
        field: 'address',
        value: address,
      },
      {
        field: 'blockchainId',
        value: this.blockchainId,
      },
    ]);
    return result;
  }

  async getNonce(address: string): Promise<number> {
    const [result] = await this.get([
      {
        field: 'address',
        value: address,
      },
      {
        field: 'blockchainId',
        value: this.blockchainId,
      },
    ]);

    // If result isn't undefined and timeDiff is acceptable, we use cached nonce
    if (typeof result !== 'undefined' && result.timeDiff < allowedSecondDiff) {
      return result.nonce;
    }
    // Otherwise we use nonce from network
    return Utilities.TillSuccess(async () => this.provider.getTransactionCount(address));
  }

  async increaseNonce(address: string) {
    const nonce = await this.getNonce(address);
    await this.setNonce(address, nonce + 1);
  }
}

export default ModelNonceManagement;
