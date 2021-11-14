/* eslint-disable no-await-in-loop */
import { ethers } from 'ethers';
import { Knex } from 'knex';
import { Utilities } from 'noqueue';
import config from '../src/helper/config';
import { IBlockchain } from '../src/model/model-blockchain';
import { abi as abiERC20 } from '../artifacts/ERC20.json';
import { ERC20 } from '../typechain';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex(config.table.token).del();
  await knex(config.table.blockchain).del();

  for (let i = 0; i < config.networkRpc.length; i += 1) {
    const { name, safeConfirmation, numberOfProcessBlock, numberOfSyncBlock, nativeToken, explorerUrl, chainId, url } =
      config.networkRpc[i];
    await knex(config.table.blockchain).insert({
      name,
      safeConfirmation,
      numberOfProcessBlock,
      numberOfSyncBlock,
      nativeToken,
      explorerUrl,
      chainId,
      url,
    });
  }

  const supportedBlockchain = <IBlockchain[]>await knex(config.table.blockchain).select();

  const tokenData: Map<number, any[]> = new Map([
    [
      // Ethereum
      1,
      [
        '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
      ],
    ],
    [
      // Binance Smart Chain
      56,
      [
        '0x55d398326f99059fF775485246999027B3197955',
        '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
        '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      ],
    ],
    // Fantom Testnet
    [4002, ['0xf33B79F915fC4A870ED1b26356C9f6EB60638DB8']],
  ]);

  for (let i = 0; i < supportedBlockchain.length; i += 1) {
    const blockchain = supportedBlockchain[i];
    const provider = new ethers.providers.StaticJsonRpcProvider(blockchain.url);
    if (tokenData.has(blockchain.chainId)) {
      const tokens = await Utilities.OneForAll(tokenData.get(blockchain.chainId) || [], async (e: any) => {
        const erc20Token = <ERC20>new ethers.Contract(e, abiERC20, provider);
        return {
          type: 20,
          address: e,
          name: await erc20Token.name(),
          symbol: await erc20Token.symbol(),
          decimal: await erc20Token.decimals(),
          blockchainId: blockchain.id,
        };
      });
      await knex.batchInsert(config.table.token, tokens);
    }
  }
}

export default seed;
