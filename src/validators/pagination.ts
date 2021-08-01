import { Validator } from '../framework';

export const ValidatorPagination = new Validator(
  {
    name: 'limit',
    location: 'query',
    type: 'number',
    defaultValue: 20,
    validator: (v: number) => Number.isInteger(v) && v <= 1000,
    message: 'Invalid limit number',
  },
  {
    name: 'offset',
    location: 'query',
    type: 'number',
    defaultValue: 0,
    validator: (v: number) => Number.isInteger(v),
    message: 'Invalid offset number',
  },
  {
    name: 'order',
    location: 'query',
    type: 'array',
    defaultValue: [
      {
        column: 'id',
        order: 'desc',
      },
    ],
    validator: (v: any[]) =>
      Array.isArray(v) &&
      v.every((e: any) => typeof e === 'object' && e.column && e.order && ['asc', 'desc'].includes(e.order)),
    message: 'Invalid order type',
  },
);

export default ValidatorPagination;
