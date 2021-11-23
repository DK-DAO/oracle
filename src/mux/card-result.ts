import { Mux, Validator, IRequestData, IResponse, Pagination, IModelCondition } from '@dkdao/framework';
import { utils } from 'ethers';
import { validate } from 'uuid';
import ModelNftResult, { INftResult, INftResultDetail } from '../model/model-nft-result';

Mux.get(
  '/api/v1/cardResult',
  new Validator(
    {
      name: 'issuanceUuid',
      type: 'string',
      location: 'query',
      validator: (v) => validate(v),
      message: 'Issuance UUID that related to given',
    },
    {
      name: 'owner',
      type: 'string',
      location: 'query',
      validator: (v) => utils.isAddress(v),
      message: 'Owner address',
    },

    {
      name: 'nftBoxId',
      type: 'string',
      location: 'query',
      validator: (v) => utils.isHexString(v),
      message: 'NFT token id of box',
    },
  ).merge(Pagination.getPaginationValidator(0, 50)),
  async (req: IRequestData): Promise<IResponse<INftResultDetail>> => {
    const {
      query: { issuanceUuid, owner, nftBoxId, offset, limit, order },
    } = req;
    const imNftResult = new ModelNftResult();
    const conditions: IModelCondition<INftResult>[] = [];
    if (typeof owner === 'string' && utils.isAddress(owner)) {
      conditions.push({
        field: 'owner',
        value: owner,
      });
    }
    if (typeof issuanceUuid === 'string' && validate(issuanceUuid)) {
      conditions.push({
        field: 'issuanceUuid',
        value: issuanceUuid,
      });
    }

    if (typeof nftBoxId === 'string' && validate(nftBoxId)) {
      conditions.push({
        field: 'nftBoxId',
        value: nftBoxId,
      });
    }
    return imNftResult.getNftResultList({ offset, limit, order }, conditions);
  },
);
