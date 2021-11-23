import { Mux, Validator, IRequestData, IResponse } from '@dkdao/framework';
import { utils } from 'ethers';
import ModelDiscount, { IDiscount } from '../model/model-discount';
import config from '../helper/config';

Mux.post(
  '/api/v1/boxDiscount',
  new Validator(
    {
      name: 'address',
      type: 'string',
      require: true,
      location: 'body',
      validator: (e): boolean => utils.isAddress(e),
      message: 'It was not and Ethereum address',
    },
    {
      name: 'discount',
      type: 'float',
      require: true,
      defaultValue: 0,
      location: 'body',
      validator: (e): boolean => Number.isFinite(e) && e >= 0 && e <= 0.4,
      message: 'Percent of discount must be a float in range 0 -> 0.4',
    },
    {
      name: 'code',
      type: 'string',
      require: true,
      location: 'body',
      validator: (e): boolean => e.length <= 32,
      message: 'Discount code will be applied',
    },
  ),
  async (req: IRequestData): Promise<IResponse<IDiscount>> => {
    const {
      body: { address, discount, code },
    } = req;
    const imDiscount = new ModelDiscount();
    await imDiscount.forceUpdate({
      address,
      discount,
      code,
      phase: config.activePhase,
      memo: 'Input from web server',
    });

    const [result] = await imDiscount.get([
      {
        field: 'address',
        value: address,
      },
      {
        field: 'phase',
        value: config.activePhase,
      },
    ]);

    return { success: true, result };
  },
);
