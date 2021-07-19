import { Knex } from 'knex';
import { ModelBase } from './model-base';

export enum EProcessingStatus {
  New = 0,
  Processing = 1,
  Success = 2,
  Error = 255,
}

export interface ITransaction {
  id: number;
  blockchainId: number;
  nftId: number;
  from: string;
  to: string;
  nftTokenId: string;
  blockNumber: number;
  blockHash: string;
  memo: string;
  contractAddress: string;
  transactionHash: string;
  createdDate: string;
}

export interface ITransactionDetail extends ITransaction {
  chainId: number;
  blockchainName: string;
  nftName: string;
  nftSymbol: string;
  nftAddress: string;
}

export class ModelTransaction extends ModelBase<ITransaction> {
  constructor() {
    super('transaction');
  }

  public getTransactionDetail(): Promise<ITransactionDetail | undefined> {
    return this.getDetailQuery().where({ status: EProcessingStatus.New }).orderBy('id', 'asc').limit(1).first();
  }

  public getDetailQuery() {
    return this.getKnex()('transaction as t')
      .select(
        't.id as id',
        't.blockchainId as blockchainId',
        'nftId',
        'from',
        'to',
        'nftTokenId',
        'blockNumber',
        'blockHash',
        'memo',
        'contractAddress',
        'transactionHash',
        't.createdDate as createdDate',
        'b.name as blockchainName',
        'b.chainId as chainId',
        'n.name as nftName',
        'n.symbol as nftSymbol',
        'n.address as nftAddress',
      )
      .join('nft as n', 't.nftId', 'n.id')
      .join('blockchain as b', 't.blockchainId', 'b.id');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select(
      'id',
      'blockchainId',
      'nftId',
      'from',
      'to',
      'nftTokenId',
      'blockNumber',
      'blockHash',
      'memo',
      'contractAddress',
      'transactionHash',
      'createdDate',
    );
  }
}

export default ModelTransaction;
