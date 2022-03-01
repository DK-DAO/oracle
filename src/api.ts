import { Mux, Connector } from '@dkdao/framework';
import config from './helper/config';
import './mux';
import './middleware';
import { APIDbInstanceName } from './helper/const';

if (config.enableDbReplica) {
    Connector.connectByUrl(config.mariadbConnectUrlReplica, APIDbInstanceName);
} else {
    Connector.connectByUrl(config.mariadbConnectUrl);
}

Mux.init(config.servicePort, config.serviceHost, config.nodeEnv === 'production');
