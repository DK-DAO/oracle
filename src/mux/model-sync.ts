import { IRequestData, IResponseRecord } from '../framework/interfaces';
import { Mux } from '../framework';

Mux.get('/api/v1/testApi', undefined, async (_reqData: IRequestData) => {
  return <IResponseRecord<{ a: string }>>{
    success: true,
    result: {
      a: 'hello',
    },
  };
});
