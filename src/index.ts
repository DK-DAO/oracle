/* eslint-disable no-await-in-loop */
import cluster from 'cluster';
import { Connector, FrameworkEvent, Mux } from './framework';
import config from './helper/config';
import logger from './helper/logger';
import { IWoker, loadWorker } from './helper/utilities';
import { ModelBlockchain } from './model/model-blockchain';
import BlockchainService from './blockchain/blockchain-service';
import { IToken } from './model/model-token';
import { IWatching } from './model/model-watching';
import { ISync } from './model/model-sync';
import './middleware';
import './mux';

FrameworkEvent.on('error', (e) => logger.error(e));

Connector.connectByUrl(config.mariadbConnectUrl);

/**
 * Main application
 * @class MainApplication
 */
class MainApplication {
  /**
   * Start master
   * @private
   * @static
   * @memberof MainApplication
   */
  private static async startMaster() {
    logger.info(`Master ${process.pid} is running`);

    logger.debug(`Node running mode: ${config.nodeEnv}`);
    const workerMap: { [key: number]: IWoker } = {};
    const pidMap: { [key: number]: number } = {};

    function startWorker(worker: Partial<IWoker>) {
      // This block to isolate API loading
      const newCluster = loadWorker(worker);
      // Add to worker map
      workerMap[newCluster.pid] = newCluster;
      pidMap[newCluster.id] = newCluster.pid;
      logger.info(`${newCluster.name} was loaded at: ${newCluster.pid}`);
    }

    const imBlockchain = new ModelBlockchain();
    const blockchains = await imBlockchain.get();
    const knex = Connector.getInstance();
    let activeBlockchains;
    if (config.nodeEnv === 'development') {
      activeBlockchains = blockchains.filter((b) => b.chainId === config.developmentChainId);
      await knex('open_result').delete();
      await knex('nft_ownership').delete();
      await knex('airdrop').delete();
      await knex('sync').delete();
      await knex('open_schedule').delete();
      await knex('event').delete();
      // await knex('secret').delete();
      const testToken = await knex('token').select('*').where({ symbol: 'TEST' }).first();
      if (typeof testToken === 'undefined') {
        await knex('token').insert(<IToken>{
          address: '0x17b6cB153684139DFB8267275F4504Ba1F05a3bF',
          blockchainId: activeBlockchains[0].id,
          type: 20,
          decimal: 18,
          name: 'Test Token',
          symbol: 'TEST',
        });
        await knex('watching').insert(<IWatching>{
          address: '0x9ccc80a5beD6f15AdFcB9096109500B3c96a8e52',
          type: 0,
          blockchainId: activeBlockchains[0].id,
          name: 'Local test account',
        });
        await knex('watching').insert(<IWatching>{
          address: '0x7ED1908819cc4E8382D3fdf145b7e2555A9fb6db',
          type: 1,
          blockchainId: activeBlockchains[0].id,
          name: 'Gitcoin account',
        });
      }
      await knex('sync').insert(<ISync>{
        blockchainId: activeBlockchains[0].id,
        startBlock: 0,
        syncedBlock: 0,
        targetBlock: 0,
      });
    } else {
      // Now we active ethereum and bsc
      activeBlockchains = blockchains.filter((b) => b.chainId !== config.developmentChainId);
      /*
      await knex('nft_ownership').delete();
      await knex('sync').delete();
      await knex('open_schedule').delete();
      await knex('event').delete();
      await knex('watching').delete();
      await knex('sync').delete();
      const watchingDonation = await knex('watching')
        .select('*')
        .where({ address: '0x7ED1908819cc4E8382D3fdf145b7e2555A9fb6db' });
      if (watchingDonation.length <= 0) {
        for (let i = 0; i < activeBlockchains.length; i += 1) {
          const blockchain = activeBlockchains[i];
          if (blockchain.chainId === 1) {
            await knex('sync').insert(<ISync>{
              blockchainId: blockchain.id,
              startBlock: 12710065,
              syncedBlock: 12710065,
              targetBlock: 12710065,
            });
          }
          if (blockchain.chainId === 56) {
            await knex('sync').insert(<ISync>{
              blockchainId: blockchain.id,
              startBlock: 8789740,
              syncedBlock: 8789740,
              targetBlock: 8789740,
            });
          }
          await knex('watching').insert(<IWatching>{
            address: '0x7ED1908819cc4E8382D3fdf145b7e2555A9fb6db',
            type: 1,
            blockchainId: blockchain.id,
            name: 'Gitcoin account',
          });
        }
      }
      */
    }

    // API woker
    startWorker({
      id: -1,
      name: 'api',
    });

    for (let i = 0; i < activeBlockchains.length; i += 1) {
      startWorker({
        id: activeBlockchains[i].id,
        name: activeBlockchains[i].name,
      });
    }

    // Keep all workers alive
    cluster.on('exit', (worker: any, code: number, signal: number) => {
      const { id, name, pid } = worker.process.env;
      logger.info(`Worker pid: ${pid} name: ${name} died with code: ${code}, received: ${signal}`);
      // Respawn
      startWorker({ id, name, pid });
      // Remove old record
      delete workerMap[pid];
      delete pidMap[id];
    });
  }

  /**
   * Start gRPC service
   * @private
   * @static
   * @memberof MainApplication
   */
  private static startAPI() {
    logger.info(`Start API service ${config.serviceHost}:${config.servicePort}`);
    Mux.init(false, config.servicePort, config.serviceHost);
  }

  /**
   * Start ethereum service
   * @private
   * @static
   * @memberof MainApplication
   */
  private static startBlockchain() {
    BlockchainService.start();
  }

  /**
   * Application entry point
   * @static
   * @memberof MainApplication
   */
  public static async start() {
    if (cluster.isMaster) {
      MainApplication.startMaster();
    } else {
      const { id, name } = process.env;
      // Start API
      if (id && name && name === 'api') {
        MainApplication.startAPI();
        return;
      }
      // Start blockchain observer
      if (id && name && name !== 'api') {
        MainApplication.startBlockchain();
        return;
      }
      logger.alert('Something went wrong:', { id, name });
    }
  }
}

MainApplication.start();
