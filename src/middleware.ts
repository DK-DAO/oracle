import express from 'express';
import cors from 'cors';
import logger from './helper/logger';
import { Mux } from './framework';
import config from './helper/config';

// Use JSON parse in all possible request
Mux.use(express.json());

// Development addition debug
if (config.nodeEnv === 'development') {
  // Add debug middle ware
  Mux.use(function DebugMiddleWare(req: express.Request, _res: express.Response, next: Function) {
    logger.debug(`Request to ${req.url} was handled by ${process.pid}`);
    logger.debug('Request data:', {
      header: { ...req.headers },
      body: { ...req.body },
      query: { ...req.query },
      params: { ...req.params },
    });
    return next();
  });

  // Cors for development with origin: *
  Mux.use(cors());
}