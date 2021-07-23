import { IRequestData } from '../framework/interfaces';
import { Mux, Validator } from '../framework';
import ModelAirdrop from '../model/model-airdrop';

const pagination = new Validator(
  {
    name: 'limit',
    location: 'query',
    type: 'number',
    defaultValue: 20,
    validator: (v: number) => Number.isInteger(v) && v <= 100,
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
      v.every((e: any) => typeof e === 'object' && e.column && e.order && ['asc', 'desc'].includes(e.order)),
    message: 'Invalid order type',
  },
);

Mux.get('/api/v1/donateBalance', pagination, async (req: IRequestData) => {
  const imEvent = new ModelAirdrop();
  return imEvent.getList([], req.query);
});
