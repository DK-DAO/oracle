import { Mux, Validator, IRequestData, IResponse } from '@dkdao/framework';
import ModelDiscount, { IDiscount } from '../model/model-discount';
import config from '../helper/config';

Mux.get(
  '/api/v1/boxDiscount',
  new Validator(
    {
      name: 'address',
      type: 'string',
      require: true,
      location: 'query',
      validator: (e): boolean => /^0x[0-9a-f]{40,40}$/gi.test(e),
      message: 'It was not and Ethereum address',
    },
    {
      name: 'discount',
      type: 'float',
      require: true,
      defaultValue: 0,
      location: 'query',
      validator: (e): boolean => Number.isFinite(e) && e >= 0 && e <= 0.4,
      message: 'Percent of discount must be a float in range 0 -> 0.4',
    },
    {
      name: 'code',
      type: 'string',
      require: true,
      location: 'query',
      validator: (e): boolean => e.length <= 32,
      message: 'Discount code will be applied',
    },
  ),
  async (req: IRequestData): Promise<IResponse<IDiscount>> => {
    const {
      query: { address, discount, code },
    } = req;
    const imDiscount = new ModelDiscount();
    await imDiscount.forceUpdate({
      address,
      discount,
      code,
      phase: config.activeCampaignId,
      memo: 'Input from web server',
    });

    const [result] = await imDiscount.get([
      {
        field: 'address',
        value: address,
      },
      {
        field: 'phase',
        value: config.activeCampaignId,
      },
    ]);

    return { success: true, result };
  },
);
