export type TStage = 'genesis' | 'sale';

export const basedBoxPrice = 5;

export const batchIssue = 500;

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

export function prettyValue(v: number, p: number = 1000000) {
  return Math.ceil(v * p) / p;
}

export function discountByBoxes(noBoxes: number) {
  if (noBoxes < 5) {
    return 0;
  }
  return Math.log(noBoxes) / Math.log(100) / basedBoxPrice;
}

export function applyDiscount(basePrice: number, percent: number) {
  return basePrice * (1 - prettyValue(percent, 100));
}

export function calculatePriceAfterDiscount(noBoxes: number, discount: number = 0) {
  return applyDiscount(applyDiscount(basedBoxPrice, discount), discountByBoxes(noBoxes));
}

export function approximate(a: number, b: number, r: number = 0.5) {
  return b - b * r < a && a < b + b * r;
}

export function calculateNumberOfLootBoxes(money: number, discount: number = 0): number {
  // Cheapest is 1$ for 1 box
  const maxBoxes = Math.ceil(money);
  let noBoxes = 1;
  let price = 0;
  let diff = Infinity;
  let calculatedBox = maxBoxes;
  for (; noBoxes < maxBoxes; noBoxes += 1) {
    price = calculatePriceAfterDiscount(noBoxes, discount);
    const calculatedDiff = Math.abs(money - noBoxes * price);
    if (calculatedDiff <= diff) {
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
