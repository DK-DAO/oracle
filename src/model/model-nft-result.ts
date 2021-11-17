/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';
import { ModelMysqlBasic, IPagination, IModelCondition, IResponse } from '@dkdao/framework';

export interface INftResult {
  id: number;
  tokenId: number;
  issuanceUuid: string;
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

export interface INftResultDetail extends INftResult {
  blockchainId: number;
  blockchainName: string;
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
}

export class ModelNftResult extends ModelMysqlBasic<INftResult> {
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
        'tokenId',
        'issuanceUuid',
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
        't.blockchainId as blockchainId',
        't.name as tokenName',
        't.symbol as tokenSymbol',
        't.address as tokenAddress',
      )
      .join('token as t', 'o.tokenId', 't.id');
  }

  public async getNftResultList(
    pagination: IPagination = { offset: 0, limit: 20, order: [] },
    conditions?: IModelCondition<INftResult>[],
  ): Promise<IResponse<INftResultDetail>> {
    return this.getListByCondition<INftResultDetail>(this.attachConditions(this.detailQuery(), conditions), pagination);
  }
}

export default ModelNftResult;
