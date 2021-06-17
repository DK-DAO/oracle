import express from 'express';
import { IResponseRecord, IResponseError, IResponseList, IRequestData } from './index';

export interface IRequestHandler<T> {
  (requestData: IRequestData | any, req?: express.Request | any): Promise<
    IResponseRecord<T> | IResponseError | IResponseList<T>
  >;
}
