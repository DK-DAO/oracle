import { IRequestData, IResponseRecord } from '../framework/interfaces';
import { Mux, Validator } from '../framework';
import { ValidatorPagination } from '../validators';
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
  ).merge(ValidatorPagination),
  async (req: IRequestData): Promise<IResponseRecord<IDiscount>> => {
    const {
      query: { address, discount },
    } = req;
    const imDiscount = new ModelDiscount();
    return {
      success: true,
      result: await imDiscount.insertIfNotExist({
        address,
        discount,
        campaignId: config.activeCampaignId,
        memo: 'Input from server',
      }),
    };
  },
);
