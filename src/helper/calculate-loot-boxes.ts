import moment from 'moment';
import config from './config';

/* eslint-disable no-bitwise */
export type TStage = 'genesis' | 'earlybird' | 'latelybird';

export interface ICalculateResult {
  numberOfLooBoxes: number;
  distribution: number[];
  price: number;
}

function repeat(el: any, times: number): any[] {
  const r = [];
  for (let i = 0; i < times; i += 1) {
    r.push(el);
  }
  return r;
}

function calculateDiscountByDuration(today: number, discountDuration: number = 30) {
  return Math.sqrt(discountDuration ** 2 - discountDuration * today) / 100;
}

function calculateDiscountByNumberOfBoxes(numberOfLootBoxes: number) {
  return Math.log(numberOfLootBoxes) / Math.log(100) / 5;
}

function applyDiscount(basePrice: number, percent: number) {
  return basePrice * (1 - percent);
}

function calculateDiscount(numberOfLootBoxes: number, stage: TStage, today: number) {
  let price = 5;
  switch (stage) {
    case 'genesis':
      price = 1;
      break;
    case 'earlybird':
      price = applyDiscount(price, calculateDiscountByDuration(today));
      price = applyDiscount(price, calculateDiscountByNumberOfBoxes(numberOfLootBoxes));
      break;
    case 'latelybird':
    default:
      price = applyDiscount(price, calculateDiscountByNumberOfBoxes(numberOfLootBoxes));
  }
  return price;
}

export function approximate(a: number, b: number, r: number = 0.0001) {
  return b - b * r < a && a < b + b * r;
}

function calculateNumberOfLootBoxes(money: number, stage: TStage, today: number): number {
  let noBoxes = money / 5;
  do {
    noBoxes += 1;
  } while (noBoxes * calculateDiscount(noBoxes, stage, today) < money);
  return noBoxes;
}

export function calculateNoLootBoxes(money: number) {
  const toDay = moment(new Date());
  let stage: TStage = 'latelybird';
  let dayCount: number = 0;
  // Genesis =< toDay < earlyBird
  if (toDay.diff(config.saleScheduleGenesis, 'days') >= 0 && toDay.diff(config.saleScheduleEarlybird) < 0) {
    stage = 'genesis';
  }
  // earlyBird =< toDay < earlyBird + 30
  if (
    toDay.diff(config.saleScheduleEarlybird, 'days') >= 0 &&
    toDay.diff(moment(config.saleScheduleEarlybird).add(30, 'days'), 'days') < 0
  ) {
    stage = 'genesis';
    dayCount = toDay.diff(config.saleScheduleEarlybird, 'days');
  }
  return calculateNumberOfLootBoxes(money, stage, dayCount);
}

export function calculateDistribution(noBoxes: number) {
  let r = noBoxes;
  const i = (r / 10) >>> 0;
  r -= i * 10;
  const j = (r / 5) >>> 0;
  r -= j * 5;
  return repeat(10, i).concat(repeat(5, j)).concat(repeat(1, r));
}
