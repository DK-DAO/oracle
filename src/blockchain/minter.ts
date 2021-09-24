import { QueueLoop } from 'noqueue';
import config from '../helper/config';
import ModelBlockchain from '../model/model-blockchain';
import Oracle from './oracle';

export class Minter {
  queue: QueueLoop = new QueueLoop();

  async start() {
    const imBlockchain = new ModelBlockchain();
    const [blockchain] = await imBlockchain.get([
      {
        field: 'chainId',
        value: config.activeChainId,
      },
    ]);
    const oracle = await Oracle.getInstance(blockchain);

    this.queue.add('oracle open loot boxes', async () => {
      await oracle.openBox();
    });

    this.queue.start();
  }
}

export default new Minter();
