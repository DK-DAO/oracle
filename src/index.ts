import cluster from 'cluster';
import { Connector } from './framework';
import config from './helper/config';
import logger from './helper/logger';
import { IWoker, loadWorker } from './helper/utilities';
import { ModelBlockchain } from './model/model-blockchain';

import './middleware';

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

    // API woker
    startWoker({
      id: -1,
      name: 'api',
    });

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
  private static startBlockchain(blockchainWorkerData: IWoker) {
    logger.info(
      `Blockchain service for ${blockchainWorkerData.id}:${blockchainWorkerData.name}`,
      `online (pid: ${blockchainWorkerData.pid})`,
    );
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
        const value = parseInt(id, 10);
        if (Number.isInteger(value)) {
          const imBlockchain = new ModelBlockchain();
          const [blockchain] = await imBlockchain.get([{ field: 'id', value: id }]);
          if (blockchain) {
            MainApplication.startBlockchain({
              id: value,
              name,
              pid: process.pid,
            });
            return;
          }
        }
      }
      logger.alert('Something went wrong:', { id, name });
    }
  }
}

MainApplication.start();
