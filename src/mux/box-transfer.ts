import { Mux, Validator, IRequestData, Pagination } from '@dkdao/framework';
import { utils } from 'ethers';
import { validate } from 'uuid';
import ModelNftTransfer from '../model/model-nft-transfer';

Mux.get(
  '/api/v1/boxTransfer',
  new Validator(
    {
      name: 'status',
      type: 'integer',
      location: 'query',
    },
    {
      name: 'receiver',
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
    const imNftTransfer = new ModelNftTransfer();
    const conditions = [];
    const {
      query: { status, receiver, issuanceUuid, offset, limit, order },
    } = req;
    if (typeof status === 'number' && Number.isInteger(status)) {
      conditions.push({
        field: 'status',
        value: status,
      });
    }
    if (typeof receiver === 'string' && utils.isAddress(receiver)) {
      conditions.push({
        field: 'owner',
        value: receiver,
      });
    }
    if (typeof issuanceUuid === 'string' && validate(receiver)) {
      conditions.push({
        field: 'issuanceUuid',
        value: issuanceUuid,
      });
    }
    return imNftTransfer.getBoxTransferList({ offset, limit, order }, <any>conditions);
  },
);
