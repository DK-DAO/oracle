import { Knex } from 'knex';
import { ModelBase } from './model-base';

export enum EToken {
  ERC20 = 20,
  ERC721 = 721,
}

export interface IToken {
  id: number;
  blockchainId: number;
  type: EToken;
  name: string;
  address: string;
  symbol: string;
  decimal: number;
  createdDate: string;
}

export class ModelToken extends ModelBase<IToken> {
  constructor() {
    super('token');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select(
      'id',
      'blockchainId',
      'type',
      'name',
      'symbol',
      'decimal',
      'address',
      'createdDate',
    );
  }

  public getNft() {
    return this.get([
      {
        field: 'type',
        value: EToken.ERC721,
      },
    ]);
  }

  public getToken() {
    return this.get([
      {
        field: 'type',
        value: EToken.ERC20,
      },
    ]);
  }
}

export default ModelToken;
