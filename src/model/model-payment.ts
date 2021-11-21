import { Knex } from 'knex';
import { ModelMysqlBasic, IPagination, IModelCondition, IResponse } from '@dkdao/framework';
import config from '../helper/config';

export enum EPaymentStatus {
  NewPayment = 1,
  Success = 254,
  Error = 255,
}

export interface IPayment {
  id: number;
  blockchainId: number;
  tokenId: number;
  eventId: string;
  status: EPaymentStatus;
  issuanceUuid: string;
  sender: string;
  receiver: string;
  value: string;
  memo: string;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  contractAddress: string;
  createdDate: string;
  updatedDate: string;
}

export interface IPaymentDetail extends IPayment {
  chainId: number;
  blockchainName: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: number;
  tokenAddress: string;
}

export class ModelPayment extends ModelMysqlBasic<IPayment> {
  constructor() {
    super(config.table.payment);
  }

  public getPaymentDetail(status: EPaymentStatus): Promise<IPaymentDetail | undefined> {
    return this.getDetailQuery().where({ status }).orderBy('id', 'asc').limit(1).first();
  }

  public getAllPaymentDetail(status: EPaymentStatus): Promise<IPaymentDetail[] | undefined> {
    return this.getDetailQuery().where({ status }).orderBy('id', 'asc');
  }

  public getDetailQuery() {
    return this.getKnex()(`${this.tableName} as e`)
      .select(
        'e.id as id',
        'e.blockchainId as blockchainId',
        'tokenId',
        'status',
        'eventId',
        'issuanceUuid',
        'sender',
        'receiver',
        'value',
        'memo',
        'blockNumber',
        'blockHash',
        'transactionHash',
        'contractAddress',
        'e.createdDate as createdDate',
        'e.updatedDate as updatedDate',
        'b.name as blockchainName',
        'b.chainId as chainId',
        't.decimal as tokenDecimal',
        't.name as tokenName',
        't.symbol as tokenSymbol',
        't.address as tokenAddress',
      )
      .join(`${config.table.token} as t`, 'e.tokenId', 't.id')
      .join(`${config.table.blockchain} as b`, 'e.blockchainId', 'b.id');
  }

  public async getPaymentList(
    pagination: IPagination = { offset: 0, limit: 20, order: [] },
    conditions?: IModelCondition<IPayment>[],
  ): Promise<IResponse<IPaymentDetail>> {
    return this.getListByCondition<IPaymentDetail>(
      this.attachConditions(this.getDetailQuery(), conditions || []),
      pagination,
    );
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }
}

export default ModelPayment;
