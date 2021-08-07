import moment from 'moment';
import { IRequestData, IResponseRecord } from '../framework/interfaces';
import { Mux, Validator } from '../framework';
import {
  calculateDiscount,
  getStage,
  calculateDiscountByDuration,
  calculateDiscountByNumberOfBoxes,
} from '../helper/calculate-loot-boxes';
import config from '../helper/config';

export interface IBoxPrice {
  total: number;
  stage: string;
  numberOfBoxes: number;
  discountByTime: number;
  discountByNumberofBoxes: number;
  basePriced: number;
  pricePerbox: number;
  subtotal: number;
  serverTime: string;
  discountDay: number;
}

Mux.get(
  '/api/v1/boxPrice',
  new Validator({
    name: 'numberOfBoxes',
    type: 'integer',
    require: true,
    defaultValue: 1,
    location: 'query',
    validator: (v) => Number.isFinite(v) && Number.isInteger(v),
    message: 'Number of boxes, it must be an integer',
  }),
  async (req: IRequestData): Promise<IResponseRecord<IBoxPrice>> => {
    const {
      query: { numberOfBoxes },
    } = req;
    const toDay = moment(new Date());
    const basePriced = 5;
    let discountByTime = 0;
    const stage = getStage();
    let discountDay = 0;
    if (stage === 'earlybird') {
      discountDay = toDay.diff(config.saleScheduleEarlybird, 'days');
      discountByTime = calculateDiscountByDuration(toDay.diff(config.saleScheduleEarlybird, 'days'));
    }
    const discountByNumberofBoxes = calculateDiscountByNumberOfBoxes(numberOfBoxes);
    const pricePerbox = calculateDiscount(numberOfBoxes, stage, toDay.diff(config.saleScheduleEarlybird, 'days'));
    const subtotal = numberOfBoxes * basePriced;
    const total = numberOfBoxes * pricePerbox;
    return {
      success: true,
      result: {
        numberOfBoxes,
        basePriced,
        pricePerbox,
        subtotal,
        total,
        stage,
        discountByTime,
        discountByNumberofBoxes,
        serverTime: toDay.toISOString(),
        discountDay,
      },
    };
  },
);
