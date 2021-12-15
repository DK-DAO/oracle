import { ClusterApplication, IApplicationPayload, Connector } from '@dkdao/framework';
import { ethers } from 'ethers';
import config from './helper/config';
import logger from './helper/logger';
import ModelBlockchain from './model/model-blockchain';

const main = new ClusterApplication();

main.on('new', (environment: IApplicationPayload) => {
  logger.info('Add new cluster name:', environment.name, 'Payload:', environment.payload);
});

main.on('error', (err: Error) => {
  logger.error('Found an error', err);
});

main.on('restart', (pid: number, environment: IApplicationPayload) => {
  logger.info('Restart', environment.name, 'at:', pid);
});

main.on('exit', (signal: string) => {
  logger.info('Received', signal, 'we are going to terminate child processes');
});

Connector.connectByUrl(config.mariadbConnectUrl);

(async () => {
  const imBlockchain = new ModelBlockchain();
  const blockchainActive = await imBlockchain.getActiveBlockChainList();
  const blockchainPayment = await imBlockchain.getPaymentBlockchainList();

  logger.info('Active blockchain:', blockchainActive.length, 'Active payment blockchain', blockchainPayment.length);
  logger.debug(blockchainActive, blockchainPayment);

  for (let i = 0; i < blockchainPayment.length; i += 1) {
    main.add({
      name: `Observer for ${blockchainPayment[i].name}`.toLowerCase().replace(/[\s]/gi, '-'),
      payload: `${__dirname}/observer`,
      chainId: blockchainPayment[i].chainId.toString(),
    });
  }

  for (let i = 0; i < blockchainActive.length; i += 1) {
    // @todo Remove this if possible it just need for
    if (blockchainActive[i].chainId === 911) {
      const provider = new ethers.providers.StaticJsonRpcProvider('http://localhost:8545');
      // Keep node mining
      setInterval(async () => {
        await provider.send('evm_mine', []);
      }, 1000);
    }
    main.add({
      name: `Minter for ${blockchainActive[i].name}`.toLowerCase().replace(/[\s]/gi, '-'),
      payload: `${__dirname}/minter`,
      chainId: blockchainActive[i].chainId.toString(),
    });
  }

  main
    .add({
      name: 'api',
      payload: `${__dirname}/api`,
    })
    .start();
})();
