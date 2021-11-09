import { Utilities } from '@dkdao/framework';
import { parse } from 'dotenv';
import fs from 'fs';
import { objToCamelCase } from './utilities';

export interface ITableName {
  blockchain: string;
  airdrop: string;
  config: string;
  discount: string;
  payment: string;
  nftTransfer: string;
  nftOwnership: string;
  nftResult: string;
  nftIssuance: string;
  secret: string;
  sync: string;
  token: string;
  watching: string;
  nonceManagement: string;
}

export interface IApplicationConfig {
  nodeEnv: string;
  mariadbConnectUrl: string;
  mariadbGameUrl: string;
  walletMnemonic: string;
  rpcEthereum: string;
  rpcBinance: string;
  rpcPolygon: string;
  rpcFantom: string;
  mariadbTablePrefix: string;
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

export interface IExtendApplicationConfig extends IApplicationConfig {
  table: ITableName;
}
const config: IApplicationConfig = ((conf) => {
  const converted: any = {};
  const keys = [
    'nodeEnv',
    'mariadbConnectUrl',
    'mariadbGameUrl',
    'walletMnemonic',
    'mariadbTablePrefix',
    'rpcEthereum',
    'rpcBinance',
    'rpcPolygon',
    'rpcFantom',
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
})(objToCamelCase(parse(fs.readFileSync(Utilities.File.filePathAtRoot('.env')))));

export default <IExtendApplicationConfig>{
  ...config,
  table: {
    airdrop: `${config.mariadbTablePrefix}airdrop`,
    blockchain: `${config.mariadbTablePrefix}blockchain`,
    config: `${config.mariadbTablePrefix}config`,
    discount: `${config.mariadbTablePrefix}discount`,
    payment: `${config.mariadbTablePrefix}payment`,
    nftTransfer: `${config.mariadbTablePrefix}nft_transfer`,
    nftOwnership: `${config.mariadbTablePrefix}nft_ownership`,
    nftIssuance: `${config.mariadbTablePrefix}ntf_issuance`,
    nftResult: `${config.mariadbTablePrefix}nft_result`,
    secret: `${config.mariadbTablePrefix}secret`,
    sync: `${config.mariadbTablePrefix}sync`,
    token: `${config.mariadbTablePrefix}token`,
    watching: `${config.mariadbTablePrefix}watching`,
    nonceManagement: `${config.mariadbTablePrefix}nonce_management`,
  },
};
