/* eslint-disable no-await-in-loop */
import { QueueLoop } from 'noqueue';
import { ethers, utils } from 'ethers';
import config from '../helper/config';
import logger from '../helper/logger';
import { Connector } from '../framework';
import { ModelSync, ISync } from '../model/model-sync';
import ModelBlockchain, { IBlockchain } from '../model/model-blockchain';
import ModelToken, { IToken } from '../model/model-token';
import { IWatching, ModelWatching } from '../model/model-watching';
import { parseEvent, BigNum } from '../helper/utilities';
import ModelEvent from '../model/model-event';
import Oracle from './oracle';
import ModelOpenSchedule from '../model/model-open-schedule';
import { calculateDistribution, calculateNoLootBoxes } from '../helper/calculate-loot-boxes';

interface ICachedNonce {
  nonce: number;
  timestamp: number;
}

Connector.connectByUrl(config.mariadbConnectUrl);

// Number of blocks will be synced
const numberOfBlocksToSync = 25;

// Number of blocks will be splited to worker
const numberOfBlockSplitForWorker = 5;

// Safe confirmations
const safeConfirmations = 6;

// Reveal duration
const revealDuration = 30000;

// Const nubmer of digests
const numberOfDigests = 20;

export class Blockchain {
  // Blockchain information
  private blockchain: IBlockchain = <any>{};

  // Sync status
  private synced: ISync = <any>{};

  // Instance of queue loop
  private queue: QueueLoop = new QueueLoop({ paddingTime: 5000 });

  // RPC provider
  private provider: ethers.providers.JsonRpcProvider = <ethers.providers.JsonRpcProvider>{};

  // List of watching token
  private watchingToken: IToken[] = [];

  // Watching token address
  private watchingTokenAddresses: Map<string, IToken> = new Map();

  // Watching wallet
  private watchingWallet: IWatching[] = [];

  // Watching wallet address
  private watchingWalletAddresses: Map<string, IWatching> = new Map();

  // Last time we do reveal
  private lastReveal: number = Date.now();

  // Recent cached nonce
  private cachedNonce: Map<string, ICachedNonce> = new Map();

  // Get blockchain info from env
  private async getBlockchainInfo(): Promise<boolean> {
    const imBlockchain = new ModelBlockchain();
    const id = typeof process.env.id === 'string' ? parseInt(process.env.id, 10) : -1;
    const [bcData] = await imBlockchain.get([
      {
        field: 'id',
        value: id,
      },
    ]);

    if (typeof bcData !== 'undefined') {
      this.blockchain = bcData;
      logger.info('Loading blockchain data:', bcData);
      this.provider = new ethers.providers.JsonRpcProvider(bcData.url);
      return true;
    }
    logger.error('Unable to load blockchain data of, blockchain id:', id);
    return false;
  }

  // Update list of token
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

    logger.info('Start watching', this.watchingToken.length, 'tokens on', this.blockchain.name);
  }

  // Update list of watching wallet
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

  // Update sync
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

  // Event sync will split works and pass to event worker
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
            value: BigNum(value).toString(),
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

  // Syncing events from blockchain
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
        // We skip if there diff is too small
        if (fromBlock + 1 === toBlock) {
          break;
        }
        if (fromBlock + numberOfBlockSplitForWorker <= toBlock) {
          logger.debug(
            this.blockchain.name,
            '> Scanning events from block:',
            fromBlock + 1,
            'to block:',
            fromBlock + numberOfBlockSplitForWorker,
          );
          await this.eventWorker(id, fromBlock + 1, fromBlock + numberOfBlockSplitForWorker);
        } else {
          logger.debug(this.blockchain.name, '> Scanning events from block:', fromBlock + 1, 'to block:', toBlock);
          await this.eventWorker(id, fromBlock + 1, toBlock);
        }
        fromBlock += numberOfBlockSplitForWorker;
      }
    }
  }

  // Star observer
  public async start() {
    if (await this.getBlockchainInfo()) {
      await this.updateListToken();
      await this.updateListWatching();

      this.queue.on('error', (name: string, err: Error) => {
        logger.error(`Found error in ${name}:`, err);
      });

      this.queue
        .add('update sync status', async () => {
          await this.updateSync();
        })
        .add('syncing event from blockchain', async () => {
          await this.eventSync();
        });

      // Current watching blockchain is active chain of DKDAO
      if (this.blockchain.chainId === config.activeChainId) {
        this.queue
          .add('oracle processor', async () => {
            const imEvent = new ModelEvent();
            const event = await imEvent.getEventDetail();
            if (typeof event !== 'undefined') {
              logger.debug('Start processing event', event.jsonData);
              const imOpenSchedule = new ModelOpenSchedule();
              const floatVal = BigNum(event.value).div(BigNum(10).pow(event.tokenDecimal)).toNumber();
              const numberOfLootBoxes = calculateNoLootBoxes(floatVal);
              if (!Number.isInteger(floatVal) || floatVal < 0 || numberOfLootBoxes <= 0) {
                throw new Error(`Unexpected result, value: ${floatVal}, No boxes ${numberOfLootBoxes}`);
              }
              const lootBoxDistribution = calculateDistribution(numberOfLootBoxes);
              await imOpenSchedule.batchBuy(
                event,
                lootBoxDistribution.map((item) => ({
                  campaignId: config.activeCampaignId,
                  owner: event.from,
                  memo: `Buy ${numberOfLootBoxes} boxes with ${floatVal.toFixed(2)} ${event.tokenSymbol} direct from ${
                    event.from
                  }`,
                  numberOfBox: item,
                })),
              );
            }
          })
          .add('oracle rng observer', async () => {
            if (Date.now() - this.lastReveal >= revealDuration) {
              const oracle = await Oracle.getInstance(this.blockchain);
              const { total, remaining } = await oracle.getRNGProgess();
              logger.debug(`Reveal and commit progress: ${remaining.toString()}/${total.toString()}`);
              if (remaining.lte(10)) {
                await oracle.commit(numberOfDigests);
              } else {
                await oracle.reveal();
              }
            } else {
              logger.debug('Skip reveal and commit');
            }
          });
      }

      this.queue.start();
    }
  }
}

export default new Blockchain();
