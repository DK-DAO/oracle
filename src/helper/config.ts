import { parse } from 'dotenv';
import fs from 'fs';
import { objToCamelCase } from './utilities';

interface ApplicationConfig {
  nodeEnv: string;
  mariadbConnectUrl: string;
  walletMnemonic: string;
  rpcEthereum: string;
  rpcBinance: string;
  rpcPolygon: string;
  activeChainId: number;
  developmentChainId: number;
  activeCampaignId: number;
  saleScheduleGenesis: Date;
  saleScheduleEarlybird: Date;
  addressRegistry: string;
  serviceHost: string;
  servicePort: number;
  apiUser: string;
  apiSecret: string;
}


const config = ((conf) => {
  const converted: any = {};
  const kvs = <[string, string][]>Object.entries(conf);
  for (let i = 0; i < kvs.length; i += 1) {
    const [k, v]: [string, string] = kvs[i];
    switch (k) {
      case 'activeChainId':
      case 'developmentChainId':
      case 'activeCampaignId':
      case 'servicePort':
        converted[k] = parseInt(v, 10);
        break;
      case 'saleScheduleGenesis':
      case 'saleScheduleEarlybird':
        converted[k] = new Date(v.trim());
        break;
      default:
        converted[k] = v.trim();
    }
  }
  return converted;
})(objToCamelCase(parse(fs.readFileSync(`${__dirname}/../../.env`))));

export default <ApplicationConfig>config;
