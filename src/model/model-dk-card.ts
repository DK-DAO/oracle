/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';
import config from '../helper/config';
import { ModelBase } from './model-base';
import { IEvent } from './model-event';
import Card from '../helper/card';

export interface IDkCard {
  id: number;
  synced: boolean;
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

export interface IDkCardDetail extends IDkCard {
  chainId: number;
  blockchainName: string;
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
}

export class ModelDkCard extends ModelBase<IDkCard> {
  constructor() {
    if (config.mariadbGameUrl !== '') {
      super('dk_card', 'mariadb/game');
    } else {
      super('dk_card');
    }
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async updateAnyways(event: IEvent) {
    const [dkCard] = await this.basicQuery().where({ nftTokenId: event.value });
    // If record didn't exist insert one otherwise update existing record
    if (typeof dkCard === 'undefined') {
      const card = Card.from(event.value);
      await this.create({
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
      });
    } else {
      await this.update(
        {
          owner: event.to,
          synced: false,
          transactionHash: event.transactionHash,
        },
        [
          {
            field: 'id',
            value: dkCard.id,
          },
        ],
      );
    }
  }
}

export default ModelDkCard;
