import { Knex } from 'knex';
import { ModelMysqlBasic } from '@dkdao/framework';
import config from '../helper/config';

export enum ENftTransferStatus {
  NewArrive = 1,
  Success = 254,
  Error = 255,
}

export interface INftTransfer {
  id: number;
  blockchainId: number;
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

  public getTransferDetail(status: ENftTransferStatus): Promise<INftTransferDetail | undefined> {
    return this.getDetailQuery().where({ status }).orderBy('id', 'asc').limit(1).first();
  }

  public getAllTransferDetail(status: ENftTransferStatus): Promise<INftTransferDetail[] | undefined> {
    return this.getDetailQuery().where({ status }).orderBy('id', 'asc');
  }

  public getDetailQuery() {
    return this.getKnex()(`${this.tableName} as e`)
      .select(
        'e.id as id',
        'e.blockchainId as blockchainId',
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
}

export default ModelNftTransfer;
