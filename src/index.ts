import { ClusterApplication, IApplicationPayload } from '@dkdao/framework';
import { ethers } from 'ethers';
import logger from './helper/logger';

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

/*

const provider = new ethers.providers.StaticJsonRpcProvider('http://localhost:8545');


// Keep node mining
setInterval(async () => {
  await provider.send('evm_mine', []);
}, 1000);


// We will start two instance of apollo server
main
  .add({
    name: 'observer',
    payload: `${__dirname}/observer`,
    chainId: '911',
  })
  .add({
    name: 'minter',
    payload: `${__dirname}/minter`,
    chainId: '911',
  })
  .start();
*/

main
  .add({
    name: 'api',
    payload: `${__dirname}/api`,
  })
  .start();
