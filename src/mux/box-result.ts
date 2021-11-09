import { Mux, Validator, IRequestData, IResponse, Pagination } from '@dkdao/framework';
import ModelNftResult, { INftResultDetail } from '../model/model-nft-result';
import ModelNftIssuance, { ENftIssuanceStatus } from '../model/model-nft-issuance';

Mux.get(
  '/api/v1/boxResult',
  new Validator({
    name: 'NftIssuanceId',
    type: 'integer',
    require: true,
    location: 'query',
    validator: (v) => Number.isFinite(v) && Number.isInteger(v),
    message: 'Id of open schedule',
  }).merge(Pagination.getPaginationValidator(0, 500)),
  async (req: IRequestData): Promise<IResponse<INftResultDetail>> => {
    const {
      query: { NftIssuanceId },
    } = req;
    const imNftIssuance = new ModelNftIssuance();
    const imNftResult = new ModelNftResult();
    const [NftIssuance] = await imNftIssuance.get([{ field: 'id', value: NftIssuanceId }]);
    if (typeof NftIssuance === 'undefined' || NftIssuance.status !== ENftIssuanceStatus.ResultArrived) {
      throw new Error("This schedule is unavailable or wasn't opened yet");
    }
    return imNftResult.getNftResultList(req.query, [
      {
        field: 'transactionHash',
        value: NftIssuance.transactionHash || '',
      },
    ]);
  },
);
