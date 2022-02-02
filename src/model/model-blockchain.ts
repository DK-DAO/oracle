import { Knex } from 'knex';
import { ModelMysqlBasic } from '@dkdao/framework';
import config from '../helper/config';
import { EToken } from './model-token';

export interface IBlockchain {
  id: number;
  chainId: number;
  nativeToken: string;
  explorerUrl: string;
  name: string;
  url: string;
  safeConfirmation: number;
  numberOfSyncBlock: number;
  numberOfProcessBlock: number;
  createdDate: string;
  updatedDate: string;
}

export interface IActiveTokenAndBlockchain {
  id: number;
  blockchainId: number;
  blockchainName: string;
  chainId: number;
  type: EToken;
  name: string;
  decimal: number;
  address: string;
}

export interface IActiveBlockchain {
  id: number;
  name: string;
  chainId: number;
}

export class ModelBlockchain extends ModelMysqlBasic<IBlockchain> {
  constructor() {
    super(config.table.blockchain);
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async getAllPossibleBlockchain(): Promise<IBlockchain[]> {
    return this.basicQuery().whereNot({ url: '' });
  }

  public async getTokenAndBlockchainList(): Promise<IActiveTokenAndBlockchain[]> {
    return this.getKnex()(`${config.table.token} as t`)
      .select(
        't.id',
        't.blockchainId',
        'b.name as blockchainName',
        'b.chainId as chainId',
        't.type',
        't.name',
        't.decimal',
        't.address',
      )
      .join(`${config.table.blockchain} as b`, 't.blockchainId', 'b.id')
      .whereNot({ 'b.url': '' });
  }

  public async getPaymentBlockchainList(): Promise<IActiveBlockchain[]> {
    return this.getKnex()(`${config.table.watching} as w`)
      .select('b.id', 'b.name', 'b.chainId')
      .join(`${config.table.blockchain} as b`, 'w.blockchainId', 'b.id')
      .groupBy('w.blockchainId');
  }

  public async getActiveBlockChainList(): Promise<IActiveBlockchain[]> {
    return this.getKnex()(`${config.table.token} as t`)
      .select('b.id', 'b.name', 'b.chainId')
      .join(`${config.table.blockchain} as b`, 't.blockchainId', 'b.id')
      .where('t.type', EToken.ERC721)
      .groupBy('t.blockchainId');
  }
}

export default ModelBlockchain;
