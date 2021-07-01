import cluster from 'cluster';
import { Connector } from './framework';
import config from './helper/config';
import logger from './helper/logger';
import { IWoker, loadWorker } from './helper/utilities';
import { ModelBlockchain } from './model/model-blockchain';
import BlockchainService from './blockchain/blockchain';

import './middleware';

Connector.connectByUrl(config.mariadbConnectUrl);

(async () => {
  const knex = Connector.getInstance();
  console.log(
    await knex('secret')
      .insert({
        secret: '1',
        digest: '2',
      })
      .returning('*'),
  );
})();
