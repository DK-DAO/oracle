/* eslint-disable no-await-in-loop */
import { Connector } from '@dkdao/framework';
import { ethers } from 'ethers';
import config from './helper/config';

Connector.connectByUrl(config.mariadbConnectUrl);

(async () => {
  const table = [];
  const [cf] = config.networkRpc;
  const provider = new ethers.providers.StaticJsonRpcProvider(cf.url);
  for (let i = 0; i < 10; i += 1) {
    const wallet = ethers.Wallet.fromMnemonic(
      'morning enjoy visit memory welcome wheel dish retire alert way protect soda',
      `m/44'/60'/0'/0/${i}`,
    ).connect(provider);

    table.push({
      i,
      address: await wallet.getAddress(),
      balance: `${(await wallet.getBalance()).div(10n ** 18n).toString()} FTM`,
      priv: wallet.privateKey,
      isGood: (await wallet.getAddress()) === (await new ethers.Wallet(wallet.privateKey).getAddress()),
    });
  }
  console.table(table);
})();
