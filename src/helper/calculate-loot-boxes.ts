import moment from 'moment';
import config from './config';

/* eslint-disable no-bitwise */
export type TStage = 'genesis' | 'sale';

export const basedBoxPrice = 5;

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

export function getStage(): TStage {
  let stage: TStage = 'sale';
  const toDay = moment(new Date());
  // Genesis =< toDay < earlyBird
  if (toDay.diff(config.saleScheduleSale, 'days') < 0) {
    stage = 'genesis';
  }
  return stage;
}

export function discountByBoxes(noBoxes: number) {
  return Math.log(noBoxes) / Math.log(100) / basedBoxPrice;
}

export function applyDiscount(basePrice: number, percent: number) {
  return basePrice * (1 - percent);
}

export function calculatePriceAfterDiscount(noBoxes: number, discount: number = 0) {
  return applyDiscount(applyDiscount(basedBoxPrice, discount), discountByBoxes(noBoxes));
}

export function approximate(a: number, b: number, r: number = 0.0001) {
  return b - b * r < a && a < b + b * r;
}

export function calculateNumberOfLootBoxes(money: number, discount: number = 0): number {
  let noBoxes = money / basedBoxPrice;
  do {
    noBoxes += 1;
  } while (noBoxes * calculatePriceAfterDiscount(noBoxes, discount) < money);
  return noBoxes;
}

export function calculateDistribution(noBoxes: number) {
  if (noBoxes < 10) {
    return [noBoxes];
  }
  const i = Math.floor(noBoxes / 10);
  const j = noBoxes - i * 10;
  const result = repeat(10, i);
  if (j > 0) {
    result.push(Math.round(j));
  }
  return result;
}
