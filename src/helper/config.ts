import { ConfigLoader, Singleton, Utilities, Validator } from '@dkdao/framework';
import { getBlockchainInfoFromURL, IBlockchainInfo } from './url-parser';

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

function transformConfig(parsed: any): IApplicationConfig {
  const parsing = { ...parsed };
  const networkRpc: Partial<IBlockchainInfo>[] = [];
  try {
    const serviceUrl = new URL(parsing.serviceBind);
    parsing.serviceHost = serviceUrl.hostname;
    parsing.servicePort = parseInt(serviceUrl.port, 10);
  } catch (e) {
    parsing.serviceHost = '0.0.0.0';
    parsing.servicePort = 1337;
  }
  for (let j = 0; j <= 5; j += 1) {
    if (typeof parsing[`rpc${j}`] === 'string' && parsing[`rpc${j}`].length > 0) {
      const blockchain = getBlockchainInfoFromURL(parsing[`rpc${j}`]);
      if (typeof blockchain === 'object') {
        networkRpc.push(blockchain);
      }
    }
  }
  return { networkRpc, ...parsing };
}

const configLoader = Singleton<ConfigLoader>(
  'oracle-config',
  ConfigLoader,
  `${Utilities.File.getRootFolder()}/.env`,
  new Validator(
    {
      name: 'nodeEnv',
      type: 'string',
      location: 'any',
      require: true,
      postProcess: (e) => e.trim(),
      enums: ['production', 'development', 'test', 'staging'],
    },
    {
      name: 'mariadbConnectUrl',
      type: 'string',
      location: 'any',
      require: true,
      postProcess: (e) => e.trim(),
      validator: (e) => /^mysql:\/\//.test(e),
      message: 'This configuration should look like: mysql://user:password@localhost:port/database',
    },
    {
      name: 'walletMnemonic',
      type: 'string',
      location: 'any',
      require: true,
      postProcess: (e) => e.trim(),
      validator: (e) => /[a-z\s]+/gi.test(e),
      message: 'Should not contain special character',
    },
    {
      name: 'privOracleDkdao',
      type: 'string',
      location: 'any',
      require: true,
      postProcess: (e) => e.trim(),
      validator: (e) => /^0x[0-9a-f]+$/gi.test(e),
      message: 'Should be a hex string',
    },
    {
      name: 'privOracleDuelistKing',
      type: 'string',
      location: 'any',
      require: true,
      postProcess: (e) => e.trim(),
      validator: (e) => /^0x[0-9a-f]+$/gi.test(e),
      message: 'Should be a hex string',
    },
    {
      name: 'serviceBind',
      type: 'string',
      location: 'any',
      require: true,
      postProcess: (e) => e.trim(),
    },
    {
      name: 'activePhase',
      type: 'integer',
      location: 'any',
      require: true,
      validator: (e) => Number.isFinite(e) && Number.isInteger(e) && e > 0,
    },
    {
      name: 'mariadbTablePrefix',
      type: 'string',
      location: 'any',
      require: true,
      postProcess: (e) => e.trim(),
    },
    {
      name: 'rpc0',
      type: 'string',
      location: 'any',
      defaultValue: '',
      postProcess: (e) => e.trim(),
    },
    {
      name: 'rpc1',
      type: 'string',
      location: 'any',
      defaultValue: '',
      postProcess: (e) => e.trim(),
    },
    {
      name: 'rpc2',
      type: 'string',
      location: 'any',
      defaultValue: '',
      postProcess: (e) => e.trim(),
    },
    {
      name: 'rpc3',
      type: 'string',
      location: 'any',
      defaultValue: '',
      postProcess: (e) => e.trim(),
    },
    {
      name: 'rpc4',
      type: 'string',
      location: 'any',
      defaultValue: '',
      postProcess: (e) => e.trim(),
    },
    {
      name: 'rpc5',
      type: 'string',
      location: 'any',
      defaultValue: '',
      postProcess: (e) => e.trim(),
    },
  ),
);

const config = transformConfig(configLoader.getConfig());

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
