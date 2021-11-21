import { Utilities } from '@dkdao/framework';
import { parse } from 'dotenv';
import fs from 'fs';
import { URL } from 'url';
import { getBlockchainInfoFromURL, IBlockchainInfo } from './url-parser';
import { objToCamelCase } from './utilities';

export interface IKeyValue {
  [key: string]: string | number | Date;
}

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
  walletMnemonic: string;
  privOracleDkdao: string;
  privOracleDuelistKing: string;
  networkRpc: IBlockchainInfo[];
  mariadbTablePrefix: string;
  activePhase: number;
  serviceHost: string;
  servicePort: number;
}

export interface IExtendApplicationConfig extends IApplicationConfig {
  table: ITableName;
}

// Read configurations from .env file
function readFromEnvFile() {
  return objToCamelCase(parse(fs.readFileSync(Utilities.File.filePathAtRoot('.env'))));
}

// Set default value is ''
function defaultValues(input: IKeyValue): IKeyValue {
  const kv: IKeyValue = {};
  const keys = [
    'nodeEnv',
    'mariadbConnectUrl',
    'walletMnemonic',
    'privOracleDkdao',
    'privOracleDuelistKing',
    'serviceBind',
    'rpc0',
    'rpc1',
    'rpc2',
    'rpc3',
    'rpc4',
    'rpc5',
    'mariadbTablePrefix',
    'activePhase',
  ];
  // Default value is empty
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    kv[key] = input[key] || '';
  }
  return kv;
}

function configParser(kv: IKeyValue): IApplicationConfig {
  const parsing: any = {};
  const networkRpc: Partial<IBlockchainInfo>[] = [];

  const kvs = <[string, string][]>Object.entries(kv);
  for (let i = 0; i < kvs.length; i += 1) {
    const [k, v]: [string, string] = kvs[i];
    switch (k) {
      case 'activePhase':
      case 'servicePort':
        parsing[k] = parseInt(v, 10);
        break;
      case 'saleScheduleSale':
        parsing[k] = new Date(v.trim());
        break;
      case 'serviceBind':
        try {
          const serviceUrl = new URL(parsing.serviceBind);
          parsing.serviceHost = serviceUrl.hostname;
          parsing.servicePort = parseInt(serviceUrl.port, 10);
        } catch (e) {
          parsing.serviceHost = '0.0.0.0';
          parsing.servicePort = 1337;
        }
        break;
      default:
        parsing[k] = v.trim();
    }
  }

  for (let j = 0; j <= 5; j += 1) {
    if (parsing[`rpc${j}`].length > 0) {
      const blockchain = getBlockchainInfoFromURL(parsing[`rpc${j}`]);
      if (typeof blockchain === 'object') {
        networkRpc.push(blockchain);
      }
    }
    delete parsing[`rpc${j}`];
  }
  return { networkRpc, ...parsing };
}

const config: IApplicationConfig = configParser(defaultValues(readFromEnvFile()));

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
