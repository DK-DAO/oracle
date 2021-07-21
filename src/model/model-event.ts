import { Knex } from 'knex';
import { ModelBase } from './model-base';

export enum EProcessingStatus {
  NewPayment = 1,
  NewDonate = 2,
  NftTransfer = 4,
  Success = 126,
  Error = 127,
}

export interface IEvent {
  id: number;
  blockchainId: number;
  tokenId: number;
  eventName: string;
  status: EProcessingStatus;
  from: string;
  to: string;
  value: string;
  topics: string;
  rawData: Buffer;
  jsonData: string;
  blockNumber: number;
  blockHash: string;
  memo: string;
  contractAddress: string;
  transactionHash: string;
  createdDate: string;
}

export interface IEventDetail extends IEvent {
  chainId: number;
  blockchainName: string;
  tokenSymbol: string;
  tokenDecimal: number;
  tokenAddress: string;
}

export class ModelEvent extends ModelBase<IEvent> {
  constructor() {
    super('event');
  }

  public getEventDetail(status: EProcessingStatus): Promise<IEventDetail | undefined> {
    return this.getDetailQuery().where({ status }).orderBy('id', 'asc').limit(1).first();
  }

  public getDetailQuery() {
    return this.getKnex()('event as e')
      .select(
        'e.id as id',
        'e.blockchainId as blockchainId',
        'tokenId',
        'eventName',
        'status',
        'from',
        'to',
        'value',
        'topics',
        'rawData',
        'jsonData',
        'blockNumber',
        'blockHash',
        'memo',
        'contractAddress',
        'transactionHash',
        'e.createdDate as createdDate',
        'b.name as blockchainName',
        'b.chainId as chainId',
        't.decimal as tokenDecimal',
        't.symbol as tokenSymbol',
        't.address as tokenAddress',
      )
      .join('token as t', 'e.tokenId', 't.id')
      .join('blockchain as b', 'e.blockchainId', 'b.id');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select(
      'id',
      'blockchainId',
      'tokenId',
      'eventName',
      'status',
      'from',
      'to',
      'value',
      'topics',
      'rawData',
      'jsonData',
      'blockNumber',
      'blockHash',
      'memo',
      'contractAddress',
      'transactionHash',
      'createdDate',
    );
  }
}

export default ModelEvent;
