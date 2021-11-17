import { Connector } from '@dkdao/framework';
import ModuleObserver from './module/observer';
import config from './helper/config';

Connector.connectByUrl(config.mariadbConnectUrl);

ModuleObserver.start();
