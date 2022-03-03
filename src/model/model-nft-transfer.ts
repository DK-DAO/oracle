import { Knex } from 'knex';
import { ModelMysqlBasic, IModelCondition, IPagination, IResponse } from '@dkdao/framework';
import config from '../helper/config';

const zeroAddress = '0x0000000000000000000000000000000000000000';

export enum ENftTransferStatus {
  NewNftTransfer = 1,
  Success = 254,
  Error = 255,
}

export interface INftTransfer {
  id: number;
  blockchainId: number;
  tokenId: number;
  status: number;
  issuanceUuid: string;
  eventId: string;
  sender: string;
  receiver: string;
  nftTokenId: string;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  contractAddress: string;
  createdDate: string;
  updatedDate: string;
}

export interface INftTransferDetail extends INftTransfer {
  chainId: number;
  blockchainName: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: number;
  tokenAddress: string;
}

export class ModelNftTransfer extends ModelMysqlBasic<INftTransfer> {
  constructor() {
    super(config.table.nftTransfer);
  }

  public async getTransferDetail(status: ENftTransferStatus): Promise<INftTransferDetail | undefined> {
    // @todo: Hot fix condition race
    return this.getDetailQuery()
      .where({ status })
      .where('e.createdDate', '<=', this.getKnex().raw('SUBDATE(NOW(), INTERVAL 1 MINUTE)'))
      .orderBy('id', 'asc')
      .limit(1)
      .first();
  }

  public async getAllTransferDetail(status: ENftTransferStatus): Promise<INftTransferDetail[] | undefined> {
    const transferDetail = await this.getTransferDetail(status);
    if (typeof transferDetail !== 'undefined') {
      return this.getDetailQuery().where({ transactionHash: transferDetail.transactionHash }).orderBy('id', 'asc');
    }
    return undefined;
  }

  public getDetailQuery() {
    return this.getKnex()(`${this.tableName} as e`)
      .select(
        'e.id as id',
        'e.blockchainId as blockchainId',
        'e.tokenId as tokenId',
        'status',
        'issuanceUuid',
        'eventId',
        'sender',
        'receiver',
        'nftTokenId',
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
      .join(`${config.table.blockchain} as b`, `e.blockchainId`, 'b.id');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async getBoxTransferList(
    pagination: IPagination = { offset: 0, limit: 20, order: [] },
    conditions?: IModelCondition<INftTransfer>[],
  ): Promise<IResponse<INftTransferDetail>> {
    return this.getListByCondition<INftTransferDetail>(
      this.attachConditions(
        this.getKnex()(`${this.tableName} as e`)
          .select(
            'status',
            'issuanceUuid',
            'eventId',
            'receiver',
            'nftTokenId',
            'blockNumber',
            'blockHash',
            'transactionHash',
            'contractAddress',
            'e.createdDate as createdDate',
            'e.updatedDate as updatedDate',
            'b.name as blockchainName',
            't.name as tokenName',
            't.symbol as tokenSymbol',
          )
          .join(`${config.table.token} as t`, 'e.tokenId', 't.id')
          .join(`${config.table.blockchain} as b`, `e.blockchainId`, 'b.id')
          .where('sender', zeroAddress)
          .where('t.symbol', 'DKI'),
        conditions,
      ),
      pagination,
    );
  }
}

export default ModelNftTransfer;
