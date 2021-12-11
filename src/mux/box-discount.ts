import { Mux, Validator, IRequestData, IResponse } from '@dkdao/framework';
import { utils } from 'ethers';
import ModelDiscount from '../model/model-discount';
import config from '../helper/config';
import { basedBoxPrice, calculatePriceAfterDiscount, discountByBoxes } from '../helper/calculate-loot-boxes';
import { BigNum } from '../helper/utilities';

Mux.post(
  '/api/v1/boxDiscount',
  new Validator(
    {
      name: 'boxes',
      type: 'integer',
      require: true,
      location: 'body',
      validator: (e): boolean => e > 0,
      message: 'Number of boxes must greater than 0',
    },
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
      validator: (e): boolean => Number.isFinite(e) && e >= 0 && e <= 0.2,
      message: 'Percent of discount must be a float in range 0 -> 0.2',
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
  async (req: IRequestData): Promise<IResponse<any>> => {
    const {
      body: { address, discount, code, boxes },
    } = req;
    const imDiscount = new ModelDiscount();
    await imDiscount.forceUpdate(
      {
        address,
        discount,
        code,
        phase: config.activePhase,
        memo: 'Input from web server',
      },
      [
        {
          field: 'address',
          value: address,
        },
        { field: 'phase', value: config.activePhase },
      ],
    );

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
    const realPrice = calculatePriceAfterDiscount(BigNum.from(boxes), BigNum.from(discount));
    return {
      success: true,
      result: {
        id: result.id,
        address: result.address,
        code: result.code,
        phase: result.phase,
        numberOfBoxes: boxes,
        boxBasePrice: basedBoxPrice.toString(),
        boxPriceAfterDiscount: realPrice.toString(),
        discountByAgency: discountByBoxes(BigNum.from(boxes)).toString(),
        discountByCode: result.discount,
        totalCost: realPrice.times(boxes),
      },
    };
  },
);
