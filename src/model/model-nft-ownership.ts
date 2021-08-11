/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';
import logger from '../helper/logger';
import { IResponseList, IPagination } from '../framework';
import { ModelBase } from './model-base';
import ModelEvent, { EProcessingStatus } from './model-event';
import Card from '../helper/card';
import ModelOpenResult, { IOpenResult } from './model-open-result';

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
        't.name as tokenName',
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
  ): Promise<IResponseList<INftOwnershipDetail>> {
    return this.getListByCondition<INftOwnershipDetail>(
      this.attachConditions(this.detailQuery(), conditions),
      pagination,
    );
  }

  // Perform batch buy based on recorded event
  public async syncOwnership(): Promise<void> {
    const imEvent = new ModelEvent();
    const imOpenResult = new ModelOpenResult();
    const events = await imEvent.getAllEventDetail(EProcessingStatus.NftTransfer);
    // We will end the process if event is undefined
    if (typeof events === 'undefined' || events.length === 0) {
      return;
    }
    logger.info(`Processing ${events.length} card issuance events`);
    for (let i = 0; i < events.length; i += 1) {
      const event = events[i];
      // Start transaction
      const tx = await this.getKnex().transaction();

      // We will end the process if event is undefined
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

        // Issue a new nft please aware of max_safe_int 2^53 issue
        if (event.from === '0x0000000000000000000000000000000000000000') {
          const card = Card.from(event.value);
          // Insert if not existed otherwise update
          if (await imOpenResult.isNotExist('nftTokenId', event.value)) {
            await tx('open_result').insert(<IOpenResult>{
              ...record,
              applicationId: Number(card.getApplicationId()),
              itemEdition: card.getEdition(),
              itemGeneration: card.getGeneration(),
              itemRareness: card.getRareness(),
              itemType: card.getType(),
              itemId: Number(card.getId()),
              itemSerial: Number(card.getSerial()),
            });
          } else {
            await tx('open_result').update({ owner: event.to }).where({ nftTokenId: event.value });
          }
        }

        // If record didn't exist insert one otherwise update existing record
        if (typeof ownership === 'undefined') {
          await tx(this.tableName).insert(record);
        } else {
          await tx(this.tableName)
            .update({ owner: event.to, transactionHash: event.transactionHash })
            .where({ id: ownership.id });
        }

        // Update status to succeed
        await tx('event').update({ status: EProcessingStatus.Success }).where({ id: event.id });
        await tx.commit();
      } catch (err) {
        await tx.rollback();
        await this.getKnex()('event').update({ status: EProcessingStatus.Error }).where({ id: event.id });
        throw err;
      }
    }
  }
}

export default ModelNftOwnership;
