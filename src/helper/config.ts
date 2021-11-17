import { Utilities } from '@dkdao/framework';
import { parse } from 'dotenv';
import fs from 'fs';
import { getBlockchainInfoFromURL, IBlockchainInfo } from './url-parser';
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
const config: IApplicationConfig = ((conf) => {
  const converted: any = {};
  const networkRpc: Partial<IBlockchainInfo>[] = [];
  const keys = [
    'nodeEnv',
    'mariadbConnectUrl',
    'walletMnemonic',
    'privOracleDkdao',
    'privOracleDuelistKing',
    'rpc0',
    'rpc1',
    'rpc2',
    'rpc3',
    'rpc4',
    'rpc5',
    'mariadbTablePrefix',
    'activePhase',
    'serviceHost',
    'servicePort',
  ];
  const kvs = <[string, string][]>Object.entries(conf);
  for (let i = 0; i < kvs.length; i += 1) {
    const [k, v]: [string, string] = kvs[i];
    switch (k) {
      case 'activePhase':
      case 'servicePort':
        converted[k] = parseInt(v, 10);
        break;
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
    converted[key] = converted[key] || '';
  }
  for (let j = 0; j <= 5; j += 1) {
    if (converted[`rpc${j}`].length > 0) {
      const blockchain = getBlockchainInfoFromURL(converted[`rpc${j}`]);
      if (typeof blockchain === 'object') {
        networkRpc.push(blockchain);
      }
    }
    delete converted[`rpc${j}`];
  }
  return { networkRpc, ...converted };
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
