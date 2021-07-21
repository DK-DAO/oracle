import { Knex } from 'knex';
import { ModelBase } from './model-base';

export enum EProcessingStatus {
  New = 0,
  Processing = 1,
  Success = 2,
  Error = 255,
}

export interface IAirdrop {
  id: number;
  blockchainId: number;
  tokenId: number;
  owner: string;
  value: string;
  createdDate: string;
}

export interface IAirdropDetail extends IAirdrop {
  chainId: number;
  blockchainName: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
}

export class ModelAirdrop extends ModelBase<IAirdrop> {
  constructor() {
    super('airdrop');
  }

  public getAirdropDetail(): Promise<IAirdropDetail | undefined> {
    return this.getDetailQuery().where({ status: EProcessingStatus.New }).orderBy('id', 'asc').limit(1).first();
  }

  public getDetailQuery() {
    return this.getKnex()('airdrop as a')
      .select(
        'a.id as id',
        'a.blockchainId as blockchainId',
        'tokenId',
        'from',
        'to',
        'value',
        'a.createdDate as createdDate',
        'b.name as blockchainName',
        'b.chainId as chainId',
        't.name as tokenName',
        't.symbol as tokenSymbol',
        't.address as tokenAddress',
      )
      .join('token as t', 'a.tokenId', 't.id')
      .join('blockchain as b', 't.blockchainId', 'b.id');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select(
      'id',
      'blockchainId',
      'tokenId',
      'owner',
      'value',
      'createdDate',
    );
  }
}

export default ModelAirdrop;
