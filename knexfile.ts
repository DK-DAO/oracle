// Update with your config settings.
import { Connector } from './src/framework/connector';
import config from './src/helper/config';

module.exports = {
  development: Connector.parseURL(config.mariadbConnectUrl),
};
