import { Mux, Validator, IRequestData, Pagination } from '@dkdao/framework';
import ModelNftIssuance from '../model/model-nft-issuance';

Mux.get(
  '/api/v1/boxSchedule',
  new Validator(
    {
      name: 'status',
      type: 'integer',
      location: 'query',
    },
    {
      name: 'owner',
      type: 'string',
      validator: (e): boolean => /^0x[0-9a-f]{40,40}$/gi.test(e),
      location: 'query',
    },
  ).merge(Pagination.getPaginationValidator(0, 500)),
  async (req: IRequestData) => {
    const imNftIssuance = new ModelNftIssuance();
    const conditions = [];
    const {
      query: { status, owner },
    } = req;
    if (typeof status === 'number' && Number.isInteger(status)) {
      conditions.push({
        field: 'status',
        value: status,
      });
    }
    if (typeof owner === 'string') {
      conditions.push({
        field: 'owner',
        value: owner,
      });
    }
    return imNftIssuance.getScheduling(req.query, <any>conditions);
  },
);
