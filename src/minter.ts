import { Connector } from '@dkdao/framework';
import ModuleMinter from './module/minter';
import config from './helper/config';

Connector.connectByUrl(config.mariadbConnectUrl);

ModuleMinter.start();
