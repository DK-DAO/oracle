import { IRequestData } from '../framework/interfaces';
import { Mux } from '../framework';
import { ValidatorPagination } from '../validators';
import ModelAirdrop from '../model/model-airdrop';

Mux.get('/api/v1/donateBalance', ValidatorPagination, async (req: IRequestData) => {
  const imEvent = new ModelAirdrop();
  return imEvent.getDonateBalanceList(req.query);
});
