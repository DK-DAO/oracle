import { IRequestData } from '../framework/interfaces';
import { Mux, Validator } from '../framework';
import ModelEvent from '../model/model-event';

const pagination = new Validator(
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
      v.every((e: any) => typeof e === 'object' && e.column && e.order && ['asc', 'desc'].includes(e.order)),
    message: 'Invalid order type',
  },
);

Mux.get('/api/v1/donateTransaction', pagination, async (req: IRequestData) => {
  const imEvent = new ModelEvent();
  return imEvent.getList([], req.query);
});
