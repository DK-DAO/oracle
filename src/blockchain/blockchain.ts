/* eslint-disable no-await-in-loop */
import { QueueLoop } from 'noqueue';
import { BigNumber, ethers, utils } from 'ethers';
import config from '../helper/config';
import logger from '../helper/logger';
import { Connector } from '../framework';
import { ModelSync, ISync } from '../model/model-sync';
import ModelBlockchain, { IBlockchain } from '../model/model-blockchain';
import ModelToken, { IToken } from '../model/model-token';
import { IWatching, ModelWatching } from '../model/model-watching';
import ModelEvent from '../model/model-event';

Connector.connectByUrl(config.mariadbConnectUrl);

const numberOfBlocksToSync = 25;
const numberOfBlockSplitForWorker = 5;
const safeConfirmations = 6;

export interface IParsedEvent {
  blockHash: string;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
}

export function getLowCaseAddress(hexString: string): string {
  if (utils.isHexString(hexString) && hexString.length >= 42) {
    // Get address from bytes 32
    return `0x${hexString.substr(-40).toLowerCase()}`;
  }
  throw new Error('Input data was not a hex string');
}

export function getChecksumAddress(hexString: string): string {
  if (utils.isHexString(hexString) && hexString.length >= 42) {
    // Get checksum address from bytes 32
    return utils.getAddress(`0x${hexString.substr(-40)}`);
  }
  throw new Error('Input data was not a hex string');
}

export function parseEvent(log: ethers.providers.Log): IParsedEvent {
  const { blockHash, transactionHash, blockNumber, topics, data, address } = log;
  // Append data to topic if these data wasn't indexed
  const eventData = [...topics];
  for (let i = 2; i < data.length; i += 64) {
    eventData.push(`0x${data.substr(i, 64)}`);
  }
  const [, from, to, value] = eventData;

  return {
    blockHash,
    contractAddress: address.toString(),
    transactionHash,
    blockNumber,
    from: getLowCaseAddress(from),
    to: getLowCaseAddress(to),
    value: BigNumber.from(value).toString(),
  };
}

export class Blockchain {
  private blockchain: IBlockchain = <any>{};

  private synced: ISync = <any>{};

  private queue: QueueLoop = new QueueLoop();

  private provider: ethers.providers.JsonRpcProvider = <ethers.providers.JsonRpcProvider>{};

  private watchingToken: IToken[] = [];

  private watchingTokenAddresses: Map<string, IToken> = new Map();

  private watchingWallet: IWatching[] = [];

  private watchingWalletAddresses: Map<string, IWatching> = new Map();

  private async getBlockchainInfo(): Promise<boolean> {
    const imBlockchain = new ModelBlockchain();
    const id = typeof process.env.id === 'string' ? parseInt(process.env.id, 10) : -1;
    const [bcData] = await imBlockchain.get([
      {
        field: 'id',
        value: id,
      },
    ]);
    this.blockchain = bcData;
    if (typeof bcData !== 'undefined') {
      this.provider = new ethers.providers.JsonRpcProvider(bcData.url);
      return true;
    }
    return false;
  }

  public async start() {
    if (await this.getBlockchainInfo()) {
      // @todo: Disable this section
      await new ModelSync().update({
        blockchainId: this.blockchain.id,
        startBlock: 12507990,
        syncedBlock: 12507990,
        targetBlock: await this.provider.getBlockNumber(),
      });
      await this.updateListToken();
      await this.updateListWatching();
      logger.debug('Blockchain info:', this.blockchain);
      this.queue.on('success', (job: string) => {
        logger.info('Completed', job);
      });
      this.queue
        .add('update sync status', async () => {
          await this.updateSync();
        })
        .add('', async () => {})
        .add('syncing event from blockchain', async () => {
          await this.eventSync();
        })
        .start();
    }
  }

  private async updateListToken() {
    const imToken = new ModelToken();
    this.watchingToken = await imToken.get([
      {
        field: 'blockchainId',
        value: this.blockchain.id,
      },
    ]);

    for (let i = 0; i < this.watchingToken.length; i += 1) {
      this.watchingTokenAddresses.set(this.watchingToken[i].address.toLowerCase(), this.watchingToken[i]);
    }
  }

  private async updateListWatching() {
    const imWatching = new ModelWatching();
    this.watchingWallet = await imWatching.get([
      {
        field: 'blockchainId',
        value: this.blockchain.id,
      },
    ]);
    for (let i = 0; i < this.watchingWallet.length; i += 1) {
      this.watchingWalletAddresses.set(this.watchingWallet[i].address.toLowerCase(), this.watchingWallet[i]);
    }
  }

  private async updateSync() {
    let isChanged = false;
    const imSync = new ModelSync();
    // We will try to read synced state from database
    if (typeof this.synced.id === 'undefined') {
      const [tmpSyncState] = await imSync.get([{ field: 'blockchainId', value: this.blockchain.id }]);
      if (typeof tmpSyncState === 'undefined') {
        const startPoint = (await this.provider.getBlockNumber()) - safeConfirmations;
        const newRecord = await imSync.create({
          blockchainId: this.blockchain.id,
          startBlock: startPoint,
          syncedBlock: startPoint,
          targetBlock: startPoint,
        });
        this.synced = <ISync>{ ...newRecord };
      } else {
        this.synced = { ...tmpSyncState };
      }
    }

    // Get sync state
    const { id, startBlock, syncedBlock, targetBlock } = this.synced;
    const updateData: Partial<ISync> = {};
    // Check for synced data is good
    if (
      typeof id !== 'undefined' &&
      typeof startBlock !== 'undefined' &&
      typeof syncedBlock !== 'undefined' &&
      typeof targetBlock !== 'undefined'
    ) {
      // Only check latest block number from blockchain if synced is less than 100 away
      if (targetBlock - syncedBlock < numberOfBlocksToSync) {
        const currentBlockNumber = (await this.provider.getBlockNumber()) - safeConfirmations;
        // Re-target
        if (currentBlockNumber > targetBlock) {
          updateData.targetBlock = currentBlockNumber;
          this.synced.targetBlock = currentBlockNumber;
          // Update after re target
          isChanged = true;
        }
      }
      // If start block greater than synced block
      if (startBlock > syncedBlock) {
        this.synced.startBlock = startBlock;
        updateData.syncedBlock = startBlock;
        isChanged = true;
      }
      // If changed save
      if (isChanged) {
        await imSync.update(updateData, [
          {
            field: 'id',
            value: id,
          },
        ]);
      }
    }
  }

  private async eventWorker(id: number, fromBlock: number, toBlock: number) {
    // Get logs for given address
    const logs = await this.provider.getLogs({
      fromBlock,
      toBlock,
      topics: [utils.id('Transfer(address,address,uint256)')],
    });
    const imEvent = new ModelEvent();
    // Get log and push the events outside
    for (let i = 0; i < logs.length; i += 1) {
      const log = logs[i];
      const tokenAddress = log.address.toLowerCase();
      if (this.watchingTokenAddresses.has(tokenAddress)) {
        const token = this.watchingTokenAddresses.get(tokenAddress);
        const { from, value, to, blockHash, blockNumber, transactionHash, contractAddress } = parseEvent(log);
        if (this.watchingWalletAddresses.has(to) && (await imEvent.isNotExist('transactionHash', transactionHash))) {
          logger.info(`New event, transfer ${from} -> ${to} ${value}`);
          await imEvent.create({
            from,
            to,
            value,
            blockHash,
            blockNumber,
            transactionHash,
            contractAddress,
            tokenId: token?.id,
            topics: JSON.stringify(log.topics),
            rawData: Buffer.from(log.data.replace(/^0x/gi, ''), 'hex'),
            blockchainId: this.blockchain.id,
            eventName: 'Transfer',
            jsonData: JSON.stringify({
              eventName: 'Transfer',
              from: utils.getAddress(from),
              to: utils.getAddress(to),
              value,
            }),
          });
        }
      }
    }

    // Update synced block
    const imSync = new ModelSync();
    this.synced.syncedBlock = toBlock;
    await imSync.update({ syncedBlock: toBlock }, [{ field: 'id', value: id }]);
  }

  private async eventSync() {
    const { id, startBlock, syncedBlock, targetBlock } = this.synced;
    // Check for synced data is good
    if (
      typeof id !== 'undefined' &&
      typeof startBlock !== 'undefined' &&
      typeof syncedBlock !== 'undefined' &&
      typeof targetBlock !== 'undefined'
    ) {
      let fromBlock = syncedBlock;
      // Try to sync each 100 blocks at once
      const toBlock =
        targetBlock - syncedBlock > numberOfBlocksToSync ? syncedBlock + numberOfBlocksToSync : targetBlock;
      while (fromBlock < toBlock) {
        try {
          // We skip if there diff is too small
          if (fromBlock + 1 === toBlock) {
            break;
          }
          if (fromBlock + numberOfBlockSplitForWorker <= toBlock) {
            logger.debug(
              'Scanning events from block:',
              fromBlock + 1,
              'to block:',
              fromBlock + numberOfBlockSplitForWorker,
            );
            await this.eventWorker(id, fromBlock + 1, fromBlock + numberOfBlockSplitForWorker);
          } else {
            logger.debug('Scanning events from block:', fromBlock + 1, 'to block:', toBlock);
            await this.eventWorker(id, fromBlock + 1, toBlock);
          }
          fromBlock += numberOfBlockSplitForWorker;
        } catch (err) {
          logger.error('Can not sync from:', fromBlock, 'to:', toBlock, err);
        }
      }
    }
  }
}

export default new Blockchain();
