import { Knex } from 'knex';
import { ModelBase } from './model-base';
import { IPagination, IResponseList, Pagination } from '../framework';
import { BigNum } from '../helper/utilities';

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

export interface IDonateTransaction {
  id: number;
  chainId: number;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  tokenAddress: string;
  tokenDecimal: number;
  blockchainName: string;
  transactionHash: string;
}

export class ModelEvent extends ModelBase<IEvent> {
  constructor() {
    super('event');
  }

  public getEventDetail(status: EProcessingStatus): Promise<IEventDetail | undefined> {
    return this.getDetailQuery().where({ status }).orderBy('id', 'asc').limit(1).first();
  }

  public getDonate() {
    return this.getKnex()('event as e')
      .select(
        'e.id as id',
        'b.chainId as chainId',
        'from',
        'to',
        'value',
        'transactionHash',
        'b.name as blockchainName',
        't.decimal as tokenDecimal',
        't.symbol as tokenSymbol',
        't.address as tokenAddress',
      )
      .join('token as t', 'e.tokenId', 't.id')
      .join('blockchain as b', 'e.blockchainId', 'b.id');
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

  public async getList(
    conditions: {
      field: keyof IEvent;
      operator?: '=' | '>' | '<' | '>=' | '<=';
      value: string | number;
    }[] = [],
    pagination: IPagination = { offset: 0, limit: 20, order: [] },
  ): Promise<IResponseList<IEventDetail>> {
    const query = this.getDonate();
    for (let i = 0; i < conditions.length; i += 1) {
      const { field, operator, value } = conditions[i];
      if (operator) {
        query.where(field, operator, value);
      } else {
        query.where(field, '=', value);
      }
    }
    for (let i = 0; i < pagination.order.length; i += 1) {
      const { column, order } = pagination.order[i];
      query.orderBy(column, order);
    }
    const result = await Pagination.pagination<IEventDetail>(query, pagination);
    result.records = result.records.map((i) => {
      return { ...i, value: BigNum.fromHexString(i.value).div(BigNum.from(10).pow(i.tokenDecimal)).toFixed(2) };
    });
    return {
      success: true,
      result,
    };
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
