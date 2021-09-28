import { Knex } from 'knex';
import { ModelMysqlBasic, IPagination, IResponse, IRecordList } from '@dkdao/framework';
import { BigNum } from '../helper/utilities';

export enum EProcessingStatus {
  NewPayment = 1,
  NewDonate = 2,
  NftTransfer = 4,
  Error = 255,
  ProcessedDonate = 126,
  Success = 127,
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
  eventId: string;
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
  tokenName: string;
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

export class ModelEvent extends ModelMysqlBasic<IEvent> {
  constructor() {
    super('event');
  }

  public getEventDetail(status: EProcessingStatus): Promise<IEventDetail | undefined> {
    return this.getDetailQuery().where({ status }).orderBy('id', 'asc').limit(1).first();
  }

  public getPaymentOrDonateEventDetail(): Promise<IEventDetail | undefined> {
    return this.getDetailQuery()
      .whereIn('status', [EProcessingStatus.ProcessedDonate, EProcessingStatus.NewPayment])
      .orderBy('id', 'asc')
      .limit(1)
      .first();
  }

  public getAllEventDetail(status: EProcessingStatus): Promise<IEventDetail[] | undefined> {
    return this.getDetailQuery().where({ status }).orderBy('id', 'asc');
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
        'eventId',
        'memo',
        'contractAddress',
        'transactionHash',
        'e.createdDate as createdDate',
        'b.name as blockchainName',
        'b.chainId as chainId',
        't.decimal as tokenDecimal',
        't.name as tokenName',
        't.symbol as tokenSymbol',
        't.address as tokenAddress',
      )
      .join('token as t', 'e.tokenId', 't.id')
      .join('blockchain as b', 'e.blockchainId', 'b.id');
  }

  public async getDonateList(
    pagination: IPagination = { offset: 0, limit: 20, order: [] },
  ): Promise<IResponse<IDonateTransaction>> {
    const { success, result } = await this.getListByCondition<IDonateTransaction>(
      this.attachConditions(this.getDonate(), [
        {
          field: 'status',
          value: EProcessingStatus.NewDonate,
        },
      ]),
      pagination,
    );
    (result as IRecordList<IDonateTransaction>).records = (result as IRecordList<IDonateTransaction>).records.map(
      (i) => {
        return { ...i, value: BigNum.fromHexString(i.value).div(BigNum.from(10).pow(i.tokenDecimal)).toFixed(2) };
      },
    );
    return { success, result };
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
      'eventId',
      'memo',
      'contractAddress',
      'transactionHash',
      'createdDate',
    );
  }
}

export default ModelEvent;
