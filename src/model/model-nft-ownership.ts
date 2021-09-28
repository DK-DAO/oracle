/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';
import { ModelMysqlBasic, IPagination, IResponse, IModelCondition, Transaction } from '@dkdao/framework';
import logger from '../helper/logger';
import ModelEvent, { EProcessingStatus } from './model-event';
import Card from '../helper/card';
import { IOpenResult } from './model-open-result';
import { EOpenScheduleStatus } from './model-open-schedule';
import ModelDkCard from './model-dk-card';

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

export class ModelNftOwnership extends ModelMysqlBasic<INftOwnership> {
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
    conditions?: IModelCondition<INftOwnership>[],
  ): Promise<IResponse<INftOwnershipDetail>> {
    return this.getListByCondition<INftOwnershipDetail>(
      this.attachConditions(this.detailQuery(), conditions),
      pagination,
    );
  }

  // Perform batch buy based on recorded event
  public async syncOwnership(): Promise<void> {
    const imEvent = new ModelEvent();
    const imDkCard = new ModelDkCard();
    const issuanceIdMap = new Map<string, number>();
    const txHashes: string[] = [];
    const events = await imEvent.getAllEventDetail(EProcessingStatus.NftTransfer);
    // We will end the process if event is undefined
    if (typeof events === 'undefined' || events.length === 0) {
      return;
    }
    logger.info(`Processing ${events.length} card issuance events`);
    for (let i = 0; i < events.length; i += 1) {
      const event = events[i];

      // Start transaction processing
      await Transaction.getInstance()
        .process(async (tx: Knex.Transaction) => {
          const record = <INftOwnership>{
            blockchainId: event.blockchainId,
            tokenId: event.tokenId,
            nftTokenId: event.value,
            transactionHash: event.transactionHash,
            owner: event.to,
          };

          const card = Card.from(event.value);

          // Issue a new nft please aware of max_safe_int 2^53 issue
          if (event.from === '0x0000000000000000000000000000000000000000') {
            // Push tx hash to stack
            if (!txHashes.includes(event.transactionHash)) {
              const [currentSchedule] = await tx('open_schedule').select('*').where({
                transactionHash: event.transactionHash,
              });
              if (typeof currentSchedule !== 'undefined') {
                issuanceIdMap.set(event.transactionHash, currentSchedule.issuanceId || 0);
              } else {
                logger.error(`Transaction ${event.transactionHash} was not existed.`);
              }
              txHashes.push(event.transactionHash);
            }

            // Insert if not existed otherwise update

            const [id] = await tx('open_result').select('id').where({ nftTokenId: event.value });
            if (typeof id === 'undefined') {
              await tx('open_result').insert(<IOpenResult>{
                ...record,
                applicationId: Number(card.getApplicationId()),
                issuanceId: issuanceIdMap.get(event.transactionHash) || 0,
                itemEdition: card.getEdition(),
                itemGeneration: card.getGeneration(),
                itemRareness: card.getRareness(),
                itemType: card.getType(),
                itemId: Number(card.getId()),
                itemSerial: Number(card.getSerial()),
              });
            } else {
              await tx('open_result')
                .update({ owner: event.to, issuanceId: issuanceIdMap.get(event.transactionHash) || 0 })
                .where({ nftTokenId: event.value });
            }
          }

          // If record didn't exist insert one otherwise update existing record
          const [ownership] = await tx('nft_ownership').select('*').where({ nftTokenId: event.value });
          if (typeof ownership === 'undefined') {
            await tx('nft_ownership').insert(record);
          } else {
            await tx('nft_ownership')
              .update({ owner: event.to, transactionHash: event.transactionHash })
              .where({ id: ownership.id });
          }

          // DK Card hook
          await imDkCard.forceUpdate(
            {
              nftTokenId: event.value,
              transactionHash: event.transactionHash,
              owner: event.to,
              synced: false,
              applicationId: Number(card.getApplicationId()),
              itemEdition: card.getEdition(),
              itemGeneration: card.getGeneration(),
              itemRareness: card.getRareness(),
              itemType: card.getType(),
              itemId: Number(card.getId()),
              itemSerial: Number(card.getSerial()),
            },
            [
              {
                field: 'nftTokenId',
                value: event.value,
              },
            ],
          );

          // Update open schedule status
          await tx('open_schedule')
            .update({
              status: EOpenScheduleStatus.ResultArrived,
            })
            .whereIn('transactionHash', txHashes);

          // Update status to succeed
          await tx('event').update({ status: EProcessingStatus.Success }).where({ id: event.id });
        })
        .catch(async (error: Error) => {
          await this.getKnex()('event').update({ status: EProcessingStatus.Error }).where({ id: event.id });
          logger.error('Can not sync nft ownership', error);
        })
        .exec();
    }
  }
}

export default ModelNftOwnership;
