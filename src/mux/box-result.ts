import { Mux, Validator, IRequestData, IResponse, Pagination } from '@dkdao/framework';
import ModelOpenResult, { IOpenResultDetail } from '../model/model-open-result';
import ModelOpenSchedule, { EOpenScheduleStatus } from '../model/model-open-schedule';

Mux.get(
  '/api/v1/boxResult',
  new Validator({
    name: 'openScheduleId',
    type: 'integer',
    require: true,
    location: 'query',
    validator: (v) => Number.isFinite(v) && Number.isInteger(v),
    message: 'Id of open schedule',
  }).merge(Pagination.getPaginationValidator(0, 500)),
  async (req: IRequestData): Promise<IResponse<IOpenResultDetail>> => {
    const {
      query: { openScheduleId },
    } = req;
    const imOpenSchedule = new ModelOpenSchedule();
    const imOpenResult = new ModelOpenResult();
    const [openSchedule] = await imOpenSchedule.get([{ field: 'id', value: openScheduleId }]);
    if (typeof openSchedule === 'undefined' || openSchedule.status !== EOpenScheduleStatus.ResultArrived) {
      throw new Error("This schedule is unavailable or wasn't opened yet");
    }
    return imOpenResult.getOpenResultList(req.query, [
      {
        field: 'transactionHash',
        value: openSchedule.transactionHash || '',
      },
    ]);
  },
);
