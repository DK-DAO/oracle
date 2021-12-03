import { Mux, Validator, IRequestData, Pagination } from '@dkdao/framework';
import { utils } from 'ethers';
import ModelNftOwnership from '../model/model-nft-ownership';

Mux.get(
  '/api/v1/nftOwnership',
  new Validator(
    {
      name: 'owner',
      type: 'string',
      validator: (e): boolean => utils.isAddress(e),
      location: 'query',
    },
    {
      name: 'tokenSymbol',
      type: 'string',
      validator: (e): boolean => /[A-Z]{3,32}/.test(e),
      location: 'query',
    },
  ).merge(Pagination.getPaginationValidator(0, 500)),
  async (req: IRequestData) => {
    const imNftOwnership = new ModelNftOwnership();
    const conditions: any[] = [];
    const {
      query: { owner, tokenSymbol },
    } = req;
    if (typeof owner === 'string') {
      conditions.push({
        field: 'owner',
        value: owner,
      });
    }
    if (typeof tokenSymbol === 'string') {
      conditions.push({
        field: 't.symbol',
        value: tokenSymbol,
      });
    }
    return imNftOwnership.getNftList(req.query, conditions);
  },
);
