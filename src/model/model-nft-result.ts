/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';
import { ModelMysqlBasic, IPagination, IModelCondition, IResponse } from '@dkdao/framework';
import config from '../helper/config';

export interface INftResult {
  id: number;
  tokenId: number;
  issuanceUuid: string;
  nftBoxId: string;
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
    super(config.table.nftResult);
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public detailQuery() {
    return this.getKnex()(`${config.table.nftResult} as o`)
      .select(
        'o.id as id',
        'tokenId',
        'issuanceUuid',
        'nftBoxId',
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
        'o.updatedDate as updatedDate',
        'o.createdDate as createdDate',
        't.blockchainId as blockchainId',
        't.name as tokenName',
        't.symbol as tokenSymbol',
        't.address as tokenAddress',
      )
      .join(`${config.table.token} as t`, 'o.tokenId', 't.id');
  }

  public async getNftResultList(
    pagination: IPagination = { offset: 0, limit: 20, order: [] },
    conditions?: IModelCondition<INftResult>[],
  ): Promise<IResponse<INftResultDetail>> {
    return this.getListByCondition<INftResultDetail>(
      this.attachConditions(
        this.getKnex()(`${this.tableName} as r`)
          .select(
            'issuanceUuid',
            'nftBoxId',
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
            'r.updatedDate as updatedDate',
            'r.createdDate as createdDate',
          )
          .join(`${config.table.token} as t`, 'r.tokenId', 't.id'),
        conditions,
      ),
      pagination,
    );
  }
}

export default ModelNftResult;
