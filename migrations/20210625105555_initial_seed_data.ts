import { Knex } from 'knex';
import config from '../src/helper/config';
import { IBlockchain } from '../src/model/model-blockchain';
import { IToken } from '../src/model/model-token';

function lookup<T extends any>(data: T[], field: keyof T, value: any): T {
  return data.filter((i) => i[field] === value)[0];
}

export async function up(knex: Knex): Promise<void> {
  await knex.batchInsert('blockchain', <IBlockchain[]>[
    {
      url: config.rpcEthereum,
      name: 'Ethereum Mainnet',
      chainId: 1,
      explorerUrl: 'https://etherscan.io',
      nativeToken: 'ETH',
    },
    {
      url: config.rpcBinance,
      name: 'Binance Smart Chain',
      chainId: 56,
      explorerUrl: 'https://bscscan.com',
      nativeToken: 'BNB',
    },
    {
      url: config.rpcPolygon,
      chainId: 137,
      name: 'Polygon',
      nativeToken: 'MATIC',
      explorerUrl: 'https://polygonscan.com',
    },
    {
      url: 'http://localhost:8545',
      chainId: 911,
      name: 'Local Network',
      nativeToken: 'ETH',
      explorerUrl: '',
    },
  ]);

  const supportedBlockchain = <IBlockchain[]>await knex('blockchain').select();

  await knex.batchInsert('token', <IToken[]>[
    // Ethereum blockchain
    {
      blockchainId: lookup(supportedBlockchain, 'chainId', 1).id,
      type: 20,
      name: 'Tether USD (USDT)',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      decimal: 6,
    },
    {
      blockchainId: lookup(supportedBlockchain, 'chainId', 1).id,
      type: 20,
      name: 'Dai Stablecoin (DAI)',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      decimal: 18,
    },
    {
      blockchainId: lookup(supportedBlockchain, 'chainId', 1).id,
      type: 20,
      name: 'USD Coin (USDC)',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      decimal: 6,
    },
    {
      blockchainId: lookup(supportedBlockchain, 'chainId', 1).id,
      type: 20,
      name: 'Binance USD (BUSD)',
      address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
      symbol: 'BUSD',
      decimal: 18,
    },
    // Binance smart chain
    {
      blockchainId: lookup(supportedBlockchain, 'chainId', 56).id,
      type: 20,
      name: 'Binance-Peg BSC-USD',
      address: '0x55d398326f99059fF775485246999027B3197955',
      symbol: 'USDT',
      decimal: 18,
    },
    {
      blockchainId: lookup(supportedBlockchain, 'chainId', 56).id,
      type: 20,
      name: 'Binance-Peg Dai Token (DAI)',
      address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
      symbol: 'DAI',
      decimal: 18,
    },
    {
      blockchainId: lookup(supportedBlockchain, 'chainId', 56).id,
      type: 20,
      name: 'Binance-Peg USD Coin (USDC)',
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      symbol: 'USDC',
      decimal: 18,
    },
    {
      blockchainId: lookup(supportedBlockchain, 'chainId', 56).id,
      type: 20,
      name: 'Binance-Peg BUSD Token (BUSD)',
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      symbol: 'BUSD',
      decimal: 18,
    },
    // Polygon blockchain
    {
      blockchainId: lookup(supportedBlockchain, 'chainId', 137).id,
      type: 20,
      name: '(PoS) Dai Stablecoin (DAI)',
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      symbol: 'DAI',
      decimal: 18,
    },
    {
      blockchainId: lookup(supportedBlockchain, 'chainId', 137).id,
      type: 20,
      name: 'USD Coin (PoS) (USDC)',
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      decimal: 6,
    },
    {
      blockchainId: lookup(supportedBlockchain, 'chainId', 137).id,
      type: 20,
      name: '(PoS) Tether USD',
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      decimal: 6,
    },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex('event').delete();
  await knex('token').delete();
  await knex('blockchain').delete().whereIn('chainId', [1, 56, 137]);
}
