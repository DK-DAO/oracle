import cluster from 'cluster';
import { Connector } from './framework';
import config from './helper/config';
import logger from './helper/logger';
import { IWoker, loadWorker } from './helper/utilities';
import { ModelBlockchain } from './model/model-blockchain';
import BlockchainService from './blockchain/blockchain-service';
import './middleware';
import { IToken } from './model/model-token';
import { IWatching } from './model/model-watching';
import { ISync } from './model/model-sync';

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

    function startWoker(worker: Partial<IWoker>) {
      // This block to isolate API loading
      const newCluster = loadWorker(worker);
      // Add to worker map
      workerMap[newCluster.pid] = newCluster;
      pidMap[newCluster.id] = newCluster.pid;
      logger.info(`${newCluster.name} was loaded at: ${newCluster.pid}`);
    }

    const imBlockchain = new ModelBlockchain();
    const blockchains = await imBlockchain.get();
    let activeBlockchains;
    if (config.nodeEnv === 'development') {
      // Chain 911 is reserved for development
      activeBlockchains = blockchains.filter((b) => b.chainId === 911);
      const knex = Connector.getInstance();
      await knex('sync').delete();
      await knex('event').delete();
      const testToken = await knex('token').select('*').where({ symbol: 'TEST' }).first();
      if (typeof testToken === 'undefined') {
        await knex('token').insert(<IToken>{
          address: '0xB2236AC5C114eaD69B2FEaf014d1e17dd6Fa8e4d',
          blockchainId: activeBlockchains[0].id,
          decimal: 18,
          name: 'Test Token',
          symbol: 'TEST',
        });
        await knex('watching').insert(<IWatching>{
          address: '0x9ccc80a5beD6f15AdFcB9096109500B3c96a8e52',
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
      activeBlockchains = blockchains.filter((b) => b.chainId !== 911);
    }

    // API woker
    startWoker({
      id: -1,
      name: 'api',
    });

    for (let i = 0; i < activeBlockchains.length; i += 1) {
      startWoker({
        id: activeBlockchains[i].id,
        name: activeBlockchains[i].name,
      });
    }

    // Keep all workers alive
    cluster.on('exit', (worker: any, code: number, signal: number) => {
      const { id, name, pid } = worker.process.env;
      logger.info(`Worker pid: ${pid} name: ${name} died with code: ${code}, received: ${signal}`);
      // Respawn
      startWoker({ id, name, pid });
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
    logger.info('Start API service');
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
