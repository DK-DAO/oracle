import { Mux, IRequestData, Pagination } from '@dkdao/framework';
import ModelEvent from '../model/model-event';

Mux.get('/api/v1/donateTransaction', Pagination.getPaginationValidator(0, 500), async (req: IRequestData) => {
  const imEvent = new ModelEvent();
  return imEvent.getDonateList(req.query);
});
