import { Mux, Connector } from '@dkdao/framework';
import config from './helper/config';
import './mux';
import './middleware';

Connector.connectByUrl(config.mariadbConnectUrl);

Mux.init(config.servicePort, config.serviceHost, config.nodeEnv === 'production');
