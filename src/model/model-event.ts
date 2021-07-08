import { Knex } from 'knex';
import { ModelBase } from './model-base';

export enum EProcessingStatus {
  New = 0,
  Processing = 1,
  Success = 2,
  Error = 255,
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

export class ModelEvent extends ModelBase<IEvent> {
  constructor() {
    super('event');
  }

  public getEvent(): Promise<IEvent | undefined> {
    return this.basicQuery().where({ status: EProcessingStatus.New }).orderBy('id', 'asc').limit(1).first();
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
