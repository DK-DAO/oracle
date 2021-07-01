import dotenv from 'dotenv';
import { objToCamelCase } from './utilities';

interface ApplicationConfig {
  nodeEnv: string;
  mariadbConnectUrl: string;
  walletMnemonic: string;
  activeChainId: string;
  addressRNG: string;
  addressDuelistKingFairDistributor: string;
  serviceHost: string;
  servicePort: string;
}
export default <ApplicationConfig>objToCamelCase(dotenv.config({ path: `${__dirname}/../../.env` }).parsed);
