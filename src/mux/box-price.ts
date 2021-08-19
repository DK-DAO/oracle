import moment from 'moment';
import { IRequestData, IResponseRecord } from '../framework/interfaces';
import { Mux, Validator } from '../framework';
import { getStage, basedBoxPrice, discountByBoxes, calculatePriceAfterDiscount } from '../helper/calculate-loot-boxes';

export interface IBoxPrice {
  total: number;
  stage: string;
  numberOfBoxes: number;
  discountByNumberOfBoxes: number;
  discountByAgency: number;
  basedBoxPrice: number;
  pricePerBox: number;
  subtotal: number;
  serverTime: string;
}

function prettyValue(v: number) {
  return Math.ceil(v * 1000000) / 1000000;
}

Mux.get(
  '/api/v1/boxPrice',
  new Validator(
    {
      name: 'noBoxes',
      type: 'integer',
      require: true,
      defaultValue: 1,
      location: 'query',
      validator: (v) => Number.isFinite(v) && Number.isInteger(v) && v <= 500 && v > 0,
      message: 'Number of boxes, it must be an integer',
    },
    {
      name: 'discount',
      type: 'float',
      require: true,
      defaultValue: 0,
      location: 'query',
      validator: (v) => Number.isFinite(v) && v >= 0 && v <= 0.4,
      message: 'Number of boxes, it must be an integer',
    },
  ),
  async (req: IRequestData): Promise<IResponseRecord<IBoxPrice>> => {
    const {
      query: { noBoxes, discount },
    } = req;
    const toDay = moment(new Date());
    const stage = getStage();
    const discountByNumberOfBoxes = discountByBoxes(noBoxes);
    const pricePerBox = calculatePriceAfterDiscount(noBoxes, discount);
    const subtotal = noBoxes * basedBoxPrice;
    const total = noBoxes * pricePerBox;
    return {
      success: true,
      result: {
        numberOfBoxes: noBoxes,
        basedBoxPrice,
        pricePerBox: prettyValue(pricePerBox),
        subtotal: prettyValue(subtotal),
        total: prettyValue(total),
        stage,
        discountByNumberOfBoxes: prettyValue(discountByNumberOfBoxes),
        discountByAgency: discount,
        serverTime: toDay.toISOString(),
      },
    };
  },
);
