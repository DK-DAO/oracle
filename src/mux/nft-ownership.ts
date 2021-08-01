import { IRequestData } from '../framework/interfaces';
import { Mux, Validator } from '../framework';
import { ValidatorPagination } from '../validators';
import ModelNftOwnership from '../model/model-nft-ownership';

Mux.get(
  '/api/v1/nftOwnership',
  new Validator(
    {
      name: 'nftTokenId',
      type: 'string',
      validator: (e): boolean => /^0x[0-9a-f]+$/gi.test(e),
      location: 'query',
    },
    {
      name: 'owner',
      type: 'string',
      validator: (e): boolean => /^0x[0-9a-f]{40,40}$/gi.test(e),
      location: 'query',
    },
  ).merge(ValidatorPagination),
  async (req: IRequestData) => {
    const imNftOwnership = new ModelNftOwnership();
    const conditions: any[] = [];
    const {
      query: { owner, nftTokenId },
    } = req;
    if (typeof owner === 'string') {
      conditions.push({
        field: 'owner',
        value: owner,
      });
    }
    if (typeof nftTokenId === 'string') {
      conditions.push({
        field: 'nftTokenId',
        value: nftTokenId,
      });
    }
    return imNftOwnership.getNftList(req.query, conditions);
  },
);
