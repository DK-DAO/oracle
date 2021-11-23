import { Mux, Validator, IRequestData, Pagination } from '@dkdao/framework';
import { utils } from 'ethers';
import ModelNftOwnership from '../model/model-nft-ownership';

Mux.get(
  '/api/v1/nftOwnership',
  new Validator({
    name: 'owner',
    type: 'string',
    validator: (e): boolean => utils.isAddress(e),
    location: 'query',
  }).merge(Pagination.getPaginationValidator(0, 500)),
  async (req: IRequestData) => {
    const imNftOwnership = new ModelNftOwnership();
    const conditions: any[] = [];
    const {
      query: { owner },
    } = req;
    if (typeof owner === 'string') {
      conditions.push({
        field: 'owner',
        value: owner,
      });
    }
    return imNftOwnership.getNftList(req.query, conditions);
  },
);
