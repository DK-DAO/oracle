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
  saleScheduleSale: Date;
  addressRegistry: string;
  serviceHost: string;
  servicePort: number;
  apiUser: string;
  apiSecret: string;
}

const config = ((conf) => {
  const converted: any = {};
  const keys = [
    'nodeEnv',
    'mariadbConnectUrl',
    'walletMnemonic',
    'rpcEthereum',
    'rpcBinance',
    'rpcPolygon',
    'activeChainId',
    'developmentChainId',
    'activeCampaignId',
    'saleScheduleSale',
    'addressRegistry',
    'serviceHost',
    'servicePort',
    'apiUser',
    'apiSecret',
  ];
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
      case 'saleScheduleSale':
        converted[k] = new Date(v.trim());
        break;
      default:
        converted[k] = v.trim();
    }
  }
  // Default value is empty
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    converted[key] = typeof converted[key] === 'undefined' ? '' : converted[key];
  }
  return converted;
})(objToCamelCase(parse(fs.readFileSync(`${__dirname}/../../.env`))));

export default <ApplicationConfig>config;
