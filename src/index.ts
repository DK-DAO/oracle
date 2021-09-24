/* eslint-disable no-await-in-loop */
import { ethers } from 'ethers';
import cluster from 'cluster';
import { Connector, FrameworkEvent, Mux } from './framework';
import config from './helper/config';
import logger from './helper/logger';
import { IWorker, loadWorker } from './helper/utilities';
import { ModelBlockchain } from './model/model-blockchain';
import BlockchainService from './blockchain/blockchain-service';
import Minter from './blockchain/minter';
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
    const workerMap: { [key: number]: IWorker } = {};
    const pidMap: { [key: number]: number } = {};

    function startWorker(worker: Partial<IWorker>) {
      // This block to isolate API loading
      const newCluster = loadWorker(worker);
      // Add to worker map
      workerMap[newCluster.pid] = newCluster;
      pidMap[newCluster.id] = newCluster.pid;
      logger.info(`${newCluster.name} was loaded at: ${newCluster.pid}`);
    }

    const imBlockchain = new ModelBlockchain();
    const blockchains = await imBlockchain.getAllPossibleBlockchain();
    const knex = Connector.getInstance();
    let activeBlockchains;
    if (config.nodeEnv === 'development') {
      activeBlockchains = blockchains.filter((b) => b.chainId === config.developmentChainId);
      const [localnetwork] = activeBlockchains;
      const provider = new ethers.providers.StaticJsonRpcProvider(localnetwork.url);
      // Keep node mining
      setInterval(async () => {
        await provider.send('evm_mine', []);
      }, 1000);

      // Clean test data
      await knex('open_result').delete();
      await knex('nonce_management').delete();
      await knex('nft_ownership').delete();
      await knex('airdrop').delete();
      await knex('sync').delete();
      await knex('open_schedule').delete();
      await knex('event').delete();
      // await knex('secret').delete();
      const testToken = await knex('token').select('*').where({ symbol: 'TEST' }).first();
      if (typeof testToken === 'undefined') {
        await knex('token').insert(<IToken>{
          address: '0x1959B7e4B844957d3b2D6F7c7F2e4A53DBB188Aa',
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
    }

    startWorker({
      id: -1,
      name: 'minter',
    });

    if (config.apiUser.length > 0) {
      // API worker
      startWorker({
        id: -1,
        name: 'api',
      });
    } else {
      logger.warning('We will skip starting API server since apiUser is empty');
    }

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

  private static startMinter() {
    Minter.start();
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
      if (id && name && name === 'minter') {
        MainApplication.startMinter();
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
