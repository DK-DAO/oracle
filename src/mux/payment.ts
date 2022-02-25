import { Mux, Validator, IRequestData, IResponse, Pagination } from '@dkdao/framework';
import { utils } from 'ethers';
import { CachingInstance } from '../libs/cache';
import ModelPayment, { IPaymentDetail } from '../model/model-payment';

Mux.get(
  '/api/v1/payment',
  new Validator({
    name: 'sender',
    type: 'string',
    location: 'query',
    validator: (v) => utils.isAddress(v),
    message: 'Sender address',
  }).merge(Pagination.getPaginationValidator(0, 50)),
  async (req: IRequestData): Promise<IResponse<IPaymentDetail>> => {
    const {
      query: { sender, offset, limit, order },
    } = req;
    const [cacheKey, cacheResult] = await CachingInstance.getKeyAndCache({
      url: '/api/v1/payment',
      params: { sender, offset, limit, order }
    })
    if (cacheResult) return cacheResult;

    const imPayment = new ModelPayment();

    if (typeof sender === 'string' && utils.isAddress(sender)) {
      return CachingInstance.saveCacheAndReturn(
        cacheKey,
        await imPayment.getPaymentList({ offset, limit, order }, [
          {
            field: 'sender',
            value: sender,
          },
        ])
      )
    }

    return CachingInstance.saveCacheAndReturn(
      cacheKey,
      await imPayment.getPaymentList({ offset, limit, order }));
  },
);
