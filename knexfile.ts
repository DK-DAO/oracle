// Update with your config settings.
import { Connector } from '@dkdao/framework';
import config from './src/helper/config';

module.exports = {
  development: Connector.parseURL(config.mariadbConnectUrl),
};
