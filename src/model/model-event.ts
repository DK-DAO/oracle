import { Knex } from 'knex';
import { ModelBase } from './model-base';

export interface IEvent {
  id: number;
  blockchainId: number;
  eventName: string;
  processed: boolean;
  from: string;
  to: string;
  value: number;
  topics: string;
  rawData: Buffer;
  jsonData: string;
  blockNumber: string;
  blockhash: string;
  memo: string;
  contractAddress: string;
  transactionHash: string;
  createdDate: string;
}

export class ModelEvent extends ModelBase<IEvent> {
  constructor() {
    super('event');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select(
      'id',
      'blockchainId',
      'tokenId',
      'eventName',
      'processed',
      'from',
      'to',
      'value',
      'topics',
      'rawData',
      'jsonData',
      'blockNumber',
      'blockhash',
      'memo',
      'contractAddress',
      'transactionHash',
      'createdDate',
    );
  }
}

export default ModelEvent;
