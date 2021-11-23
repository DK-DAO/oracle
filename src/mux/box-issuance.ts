import { Mux, Validator, IRequestData, Pagination } from '@dkdao/framework';
import { utils } from 'ethers';
import { validate } from 'uuid';
import ModelNftIssuance from '../model/model-nft-issuance';

Mux.get(
  '/api/v1/boxIssuance',
  new Validator(
    {
      name: 'status',
      type: 'integer',
      location: 'query',
    },
    {
      name: 'owner',
      type: 'string',
      validator: (e): boolean => utils.isAddress(e),
      location: 'query',
    },
    {
      name: 'issuanceUuid',
      type: 'string',
      location: 'query',
      validator: (v) => validate(v),
      message: 'Issuance UUID that related to given',
    },
  ).merge(Pagination.getPaginationValidator(0, 50)),
  async (req: IRequestData) => {
    const imNftIssuance = new ModelNftIssuance();
    const conditions = [];
    const {
      query: { status, owner, issuanceUuid, offset, limit, order },
    } = req;
    if (typeof status === 'number' && Number.isInteger(status)) {
      conditions.push({
        field: 'status',
        value: status,
      });
    }
    if (typeof owner === 'string' && utils.isAddress(owner)) {
      conditions.push({
        field: 'owner',
        value: owner,
      });
    }
    if (typeof issuanceUuid === 'string' && validate(owner)) {
      conditions.push({
        field: 'issuanceUuid',
        value: issuanceUuid,
      });
    }
    return imNftIssuance.getNftIssuanceList({ offset, limit, order }, <any>conditions);
  },
);
