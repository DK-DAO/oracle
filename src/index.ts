import { ClusterApplication, IApplicationPayload, Connector } from '@dkdao/framework';
import { ethers } from 'ethers';
import config from './helper/config';
import { APIDbInstanceName } from './helper/const';
import logger from './helper/logger';
import ModelBlockchain from './model/model-blockchain';
import { EToken } from './model/model-token';

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

const lock = new Map<string, boolean>();

function startObserver(chainId: number) {
  if (!lock.get(`observer/${chainId}`)) {
    main.add({
      name: `observer for ${chainId}`.toLowerCase().replace(/[\s]/gi, '-'),
      payload: `${__dirname}/observer`,
      chainId: chainId.toString(),
    });
    lock.set(`observer/${chainId}`, true);
  }
}

function startMinter(chainId: number) {
  if (!lock.get(`minter/${chainId}`)) {
    main.add({
      name: `minter for ${chainId}`.toLowerCase().replace(/[\s]/gi, '-'),
      payload: `${__dirname}/minter`,
      chainId: chainId.toString(),
    });
    lock.set(`minter/${chainId}`, true);
  }
}

(async () => {
  const imBlockchain = new ModelBlockchain();
  const tokenAndBlockchainList = await imBlockchain.getTokenAndBlockchainList();
  const blockchainPayment = await imBlockchain.getPaymentBlockchainList();

  for (let i = 0; i < blockchainPayment.length; i += 1) {
    startObserver(blockchainPayment[i].chainId);
  }

  for (let i = 0; i < tokenAndBlockchainList.length; i += 1) {
    const tokenAndBlockchain = tokenAndBlockchainList[i];

    // @todo Remove this if possible it just need for
    if (tokenAndBlockchain.chainId === 911) {
      const provider = new ethers.providers.StaticJsonRpcProvider('http://localhost:8545');
      // Keep node mining
      setInterval(async () => {
        await provider.send('evm_mine', []);
      }, 1000);
    }

    // We're always observer
    if (tokenAndBlockchain.type === EToken.ERC721) {
      startObserver(tokenAndBlockchain.chainId);
    }
  }

  // All RPC contain chainId will has its own minter
  for (let i = 0; i < config.networkRpc.length; i += 1) {
    const network = config.networkRpc[i];
    if (network.registry.length > 0) {
      startMinter(network.chainId);
    }
  }

  let configAPIServer: IApplicationPayload = {
    name: 'api',
    payload: `${__dirname}/api`,
  }

  if (config.enableDbReplica) {
    configAPIServer = {
      ...configAPIServer,
      dbInstance: APIDbInstanceName
    }
  }

  main
    .add(configAPIServer)
    .start();
})();
