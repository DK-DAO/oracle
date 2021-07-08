import dotenv from 'dotenv';
import { objToCamelCase } from './utilities';

interface ApplicationConfig {
  nodeEnv: string;
  mariadbConnectUrl: string;
  walletMnemonic: string;
  activeChainId: number;
  addressRng: string;
  addressDuelistKingFairDistributor: string;
  serviceHost: string;
  servicePort: string;
}
const config = ((conf) => {
  const converted: any = {};
  const kvs = <[string, string][]>Object.entries(conf);
  for (let i = 0; i < kvs.length; i += 1) {
    const [k, v]: [string, string] = kvs[i];
    switch (k) {
      case 'activeChainId':
        converted[k] = parseInt(v, 10);
        break;
      default:
        converted[k] = v.trim();
    }
  }
  return converted;
})(objToCamelCase(dotenv.config({ path: `${__dirname}/../../.env` }).parsed));

export default <ApplicationConfig>config;
