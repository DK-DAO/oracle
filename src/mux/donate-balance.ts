import { Mux, IRequestData, Pagination } from '@dkdao/framework';
import ModelAirdrop from '../model/model-airdrop';

Mux.get('/api/v1/donateBalance', Pagination.getPaginationValidator(0, 500), async (req: IRequestData) => {
  const imEvent = new ModelAirdrop();
  return imEvent.getDonateBalanceList(req.query);
});
