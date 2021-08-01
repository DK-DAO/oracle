/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';
import { IResponseList, IPagination } from '../framework';
import { ModelBase } from './model-base';
import ModelEvent, { EProcessingStatus } from './model-event';

export interface INftOwnership {
  id: number;
  blockchainId: number;
  tokenId: number;
  owner: string;
  nftTokenId: string;
  transactionHash: string;
  createdDate: string;
}

export interface INftOwnershipDetail extends INftOwnership {
  chainId: number;
  blockchainName: string;
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
}

export class ModelNftOwnership extends ModelBase<INftOwnership> {
  constructor() {
    super('nft_ownership');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public detailQuery() {
    return this.getKnex()('nft_ownership as n')
      .select(
        'n.id as id',
        'n.blockchainId as blockchainId',
        'tokenId',
        'owner',
        'nftTokenId',
        'transactionHash',
        'n.createdDate as createdDate',
        'b.name as blockchainName',
        'b.chainId as chainId',
        't.decimal as tokenDecimal',
        't.symbol as tokenSymbol',
        't.address as tokenAddress',
      )
      .join('token as t', 'n.tokenId', 't.id')
      .join('blockchain as b', 'n.blockchainId', 'b.id');
  }

  public async getNftList(
    pagination: IPagination = { offset: 0, limit: 20, order: [] },
    conditions?: {
      field: keyof INftOwnership;
      operator?: '=' | '>' | '<' | '>=' | '<=';
      value: string | number;
    }[],
  ): Promise<IResponseList<INftOwnership>> {
    return this.getListByCondition<INftOwnership>(this.attachConditions(this.detailQuery(), conditions), pagination);
  }

  // Perform batch buy based on recored event
  public async syncOwnership(): Promise<void> {
    const imEvent = new ModelEvent();
    // Start transaction
    const tx = await this.getKnex().transaction();
    const event = await imEvent.getEventDetail(EProcessingStatus.NftTransfer);
    // We will end the process if event is undefined
    if (typeof event === 'undefined') {
      await tx.rollback();
      return;
    }
    try {
      const [ownership] = await this.get([
        {
          field: 'nftTokenId',
          value: event.value,
        },
      ]);

      const record = <INftOwnership>{
        blockchainId: event.blockchainId,
        tokenId: event.tokenId,
        nftTokenId: event.value,
        transactionHash: event.transactionHash,
        owner: event.to,
      };

      // If record didn't exist insert one otherwise update existing record
      if (typeof ownership === 'undefined') {
        await tx(this.tableName).insert(record);
      } else {
        await tx(this.tableName)
          .update({ owner: event.to, transactionHash: event.transactionHash })
          .where({ id: ownership.id });
      }

      // Update status to successed
      await tx('event').update({ status: EProcessingStatus.Success }).where({ id: event.id });
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      await this.getKnex()('event').update({ status: EProcessingStatus.Error }).where({ id: event.id });
      throw err;
    }
  }
}

export default ModelNftOwnership;
