import BigNumber from 'bignumber.js';

export type TStage = 'genesis' | 'sale';

export const basedBoxPrice = new BigNumber(1.8);

export const batchIssue = 100;

function repeat(el: any, times: number): any[] {
  const r = [];
  for (let i = 0; i < times; i += 1) {
    r.push(el);
  }
  return r;
}

export function discountByBoxes(noBoxes: BigNumber): BigNumber {
  if (noBoxes.lt(5)) {
    return new BigNumber(0);
  }
  if (noBoxes.gt(500)) {
    return new BigNumber(0.3);
  }
  return noBoxes.times(3).div(2).sqrt().div(100);
}

export function applyDiscount(basePrice: BigNumber, percent: BigNumber) {
  return basePrice.times(new BigNumber(1).minus(percent));
}

export function calculatePriceAfterDiscount(noBoxes: BigNumber, discount: BigNumber = new BigNumber(0)) {
  return applyDiscount(applyDiscount(basedBoxPrice, discount), discountByBoxes(noBoxes));
}

export function calculateNumberOfLootBoxes(money: BigNumber, discount: BigNumber = new BigNumber(0)): BigNumber {
  // Cheapest is 1$ for 1 box
  const maxBoxes = new BigNumber(money.times(2).toFixed(0));
  let noBoxes = new BigNumber(0);
  let price = new BigNumber(0);
  let diff = new BigNumber(Infinity);
  let calculatedBox = maxBoxes;
  for (; noBoxes.lte(maxBoxes); noBoxes = noBoxes.plus(1)) {
    price = calculatePriceAfterDiscount(noBoxes, discount);
    const calculatedDiff = money.minus(noBoxes.times(price)).abs();
    if (calculatedDiff.lte(diff)) {
      calculatedBox = noBoxes;
      diff = calculatedDiff;
    }
  }
  return calculatedBox;
}

export function calculateDistribution(noBoxes: number) {
  if (noBoxes < batchIssue) {
    return [noBoxes];
  }
  const i = Math.floor(noBoxes / batchIssue);
  const j = noBoxes - i * batchIssue;
  const result = repeat(batchIssue, i);
  if (j > 0) {
    result.push(Math.round(j));
  }
  return result;
}
