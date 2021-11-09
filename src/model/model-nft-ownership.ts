/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';
import { ModelMysqlBasic, IPagination, IResponse, IModelCondition, Transaction } from '@dkdao/framework';
import logger from '../helper/logger';
import { ENftTransferStatus, ModelNftTransfer } from './model-nft-transfer';
import Card from '../helper/card';
import { INftResult } from './model-nft-result';
import { ENftIssuanceStatus } from './model-nft-issuance';
import config from '../helper/config';

export interface INftOwnership {
  id: number;
  blockchainId: number;
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
    super(config.table.nftOwnership);
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public detailQuery() {
    return this.getKnex()(`${config.table.nftOwnership} as n`)
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
    const imNftTransfer = new ModelNftTransfer();
    const issuanceIdMap = new Map<string, number>();
    const txHashes: string[] = [];
    const nftTransfers = await imNftTransfer.getAllTransferDetail(ENftTransferStatus.NewArrive);
    // We will end the process if event is undefined
    if (typeof nftTransfers === 'undefined' || nftTransfers.length === 0) {
      return;
    }
    logger.info(`Processing ${nftTransfers.length} card issuance events`);
    for (let i = 0; i < nftTransfers.length; i += 1) {
      const nftTransfer = nftTransfers[i];

      // Start transaction processing
      await Transaction.getInstance()
        .process(async (tx: Knex.Transaction) => {
          const record = <Partial<INftOwnership>>{
            blockchainId: nftTransfer.blockchainId,
            nftTokenId: nftTransfer.nftTokenId,
            transactionHash: nftTransfer.transactionHash,
            owner: nftTransfer.receiver,
          };

          const card = Card.from(nftTransfer.nftTokenId);

          // Issue a new nft please aware of max_safe_int 2^53 issue
          if (nftTransfer.sender === '0x0000000000000000000000000000000000000000') {
            // Push tx hash to stack
            if (!txHashes.includes(nftTransfer.transactionHash)) {
              const [currentSchedule] = await tx('open_schedule').select('*').where({
                transactionHash: nftTransfer.transactionHash,
              });
              if (typeof currentSchedule !== 'undefined') {
                issuanceIdMap.set(nftTransfer.transactionHash, currentSchedule.issuanceId || 0);
              } else {
                logger.error(`Transaction ${nftTransfer.transactionHash} was not existed.`);
              }
              txHashes.push(nftTransfer.transactionHash);
            }

            // Insert if not existed otherwise update

            const [id] = await tx('open_result').select('id').where({ nftTokenId: nftTransfer.nftTokenId });
            if (typeof id === 'undefined') {
              await tx('open_result').insert(<INftResult>{
                ...record,
                applicationId: Number(card.getApplicationId()),
                issuanceId: issuanceIdMap.get(nftTransfer.transactionHash) || 0,
                itemEdition: card.getEdition(),
                itemGeneration: card.getGeneration(),
                itemRareness: card.getRareness(),
                itemType: card.getType(),
                itemId: Number(card.getId()),
                itemSerial: Number(card.getSerial()),
              });
            } else {
              await tx('open_result')
                .update({
                  owner: nftTransfer.receiver,
                  issuanceId: issuanceIdMap.get(nftTransfer.transactionHash) || 0,
                })
                .where({ nftTokenId: nftTransfer.nftTokenId });
            }
          }

          // If record didn't exist insert one otherwise update existing record
          const [ownership] = await tx('nft_ownership').select('*').where({ nftTokenId: nftTransfer.nftTokenId });
          if (typeof ownership === 'undefined') {
            await tx('nft_ownership').insert(record);
          } else {
            await tx('nft_ownership')
              .update({ owner: nftTransfer.receiver, transactionHash: nftTransfer.transactionHash })
              .where({ id: ownership.id });
          }

          // Update open schedule status
          await tx('open_schedule')
            .update({
              status: ENftIssuanceStatus.ResultArrived,
            })
            .whereIn('transactionHash', txHashes);

          // Update status to succeed
          await tx('event').update({ status: ENftIssuanceStatus.Error }).where({ id: nftTransfer.id });
        })
        .catch(async (error: Error) => {
          await this.getKnex()('event').update({ status: ENftIssuanceStatus.Error }).where({ id: nftTransfer.id });
          logger.error('Can not sync nft ownership', error);
        })
        .exec();
    }
  }
}

export default ModelNftOwnership;
