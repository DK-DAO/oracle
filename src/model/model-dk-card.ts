/* eslint-disable no-await-in-loop */
import { Knex } from 'knex';
import { ModelMysqlBasic } from '@dkdao/framework';
import config from '../helper/config';

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

export class ModelDkCard extends ModelMysqlBasic<IDkCard> {
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
}

export default ModelDkCard;
