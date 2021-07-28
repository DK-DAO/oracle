import { IRequestData } from '../framework/interfaces';
import { Mux } from '../framework';
import { ValidatorPagination } from '../validators';
import ModelEvent from '../model/model-event';

Mux.get('/api/v1/donateTransaction', ValidatorPagination, async (req: IRequestData) => {
  const imEvent = new ModelEvent();
  return imEvent.getDonateList(req.query);
});
