import { IRequestData } from '../framework/interfaces';
import { Mux, Validator } from '../framework';
import { ValidatorPagination } from '../validators';
import ModelOpenSchedule from '../model/model-open-schedule';

Mux.get(
  '/api/v1/boxSchedule',
  new Validator({
    name: 'status',
    type: 'number',
    location: 'query',
  },{
    name: 'owner',
    type: 'string',
    validator: (e):boolean => (/^0x[0-9a-f]{40,40}$/ig).test(e),
    location: 'query',
  }).merge(ValidatorPagination),
  async (req: IRequestData) => {
    const imOpenSchedule = new ModelOpenSchedule();
    const conditions = [];
    if (typeof req.query.status === 'number' && Number.isInteger(req.query.status)) {
      conditions.push({
        field: 'status',
        value: req.query.status,
      });
    }
    if (typeof req.query.owner === 'string') {
      conditions.push({
        field: 'owner',
        value: req.query.owner,
      });
    }
    return imOpenSchedule.getScheduling(req.query, <any>conditions);
  },
);
