/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';
import { IResponseList, IPagination } from '../framework';
import { ModelBase } from './model-base';

export interface IOpenResult {
  id: number;
  blockchainId: number;
  tokenId: number;
  issuanceId: number;
  owner: string;
  nftTokenId: string;
  applicationId: number;
  itemEdition: number;
  itemGeneration: number;
  itemRareness: number;
  itemType: number;
  itemId: number;
  itemSerial: number;
  transactionHash: string;
  createdDate: string;
}

export interface IOpenResultDetail extends IOpenResult {
  chainId: number;
  blockchainName: string;
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
}

export class ModelOpenResult extends ModelBase<IOpenResult> {
  constructor() {
    super('open_result');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public detailQuery() {
    return this.getKnex()('open_result as o')
      .select(
        'o.id as id',
        'o.blockchainId as blockchainId',
        'tokenId',
        'issuanceId',
        'owner',
        'nftTokenId',
        'applicationId',
        'itemEdition',
        'itemGeneration',
        'itemRareness',
        'itemType',
        'itemId',
        'itemSerial',
        'transactionHash',
        'o.createdDate as createdDate',
        'b.name as blockchainName',
        'b.chainId as chainId',
        't.name as tokenName',
        't.symbol as tokenSymbol',
        't.address as tokenAddress',
      )
      .join('token as t', 'o.tokenId', 't.id')
      .join('blockchain as b', 'o.blockchainId', 'b.id');
  }

  public async getOpenResultList(
    pagination: IPagination = { offset: 0, limit: 20, order: [] },
    conditions?: {
      field: keyof IOpenResult;
      operator?: '=' | '>' | '<' | '>=' | '<=';
      value: string | number;
    }[],
  ): Promise<IResponseList<IOpenResultDetail>> {
    return this.getListByCondition<IOpenResultDetail>(
      this.attachConditions(this.detailQuery(), conditions),
      pagination,
    );
  }
}

export default ModelOpenResult;
