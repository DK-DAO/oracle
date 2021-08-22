/* eslint-disable no-await-in-loop */
import { QueueLoop, Utilities } from 'noqueue';
import { ethers, utils } from 'ethers';
import config from '../helper/config';
import logger from '../helper/logger';
import { ModelSync, ISync } from '../model/model-sync';
import ModelBlockchain, { IBlockchain } from '../model/model-blockchain';
import ModelToken, { EToken, IToken } from '../model/model-token';
import { EWatching, IWatching, ModelWatching } from '../model/model-watching';
import { parseEvent, BigNum } from '../helper/utilities';
import ModelEvent, { EProcessingStatus } from '../model/model-event';
import Oracle from './oracle';
import ModelOpenSchedule from '../model/model-open-schedule';
import { getStage, TStage } from '../helper/calculate-loot-boxes';
import ModelSecret from '../model/model-secret';
import ModelAirdrop from '../model/model-airdrop';
import ModelNftOwnership from '../model/model-nft-ownership';

interface Log {
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;

  removed: boolean;

  address: string;
  data: string;

  topics: string[];

  transactionHash: string;
  logIndex: number;
}

// Reveal duration 30 mins
const revealDuration = 3600000;

// Const number of digests
const numberOfDigests = 20;

export class Blockchain {
  // Blockchain information
  private blockchain: IBlockchain = <any>{};

  // Sync status
  private synced: ISync = <any>{};

  // Instance of queue loop
  private queue: QueueLoop = new QueueLoop({ paddingTime: 2000 });

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

  private oracleInstance?: Oracle;

  private stage: TStage = 'genesis';

  // Get blockchain info from env
  private async getBlockchainInfo(): Promise<boolean> {
    const imBlockchain = new ModelBlockchain();
    // Get blockchain Id from process env
    const id = typeof process.env.id === 'string' ? parseInt(process.env.id, 10) : -1;
    const [bcData] = await imBlockchain.get([
      {
        field: 'id',
        value: id,
      },
    ]);

    if (typeof bcData !== 'undefined') {
      this.blockchain = bcData;
      logger.info('Loading blockchain data:', bcData.name, bcData.chainId);
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
      logger.info(
        'Start watching',
        this.watchingToken[i].name,
        `(${this.watchingToken[i].address}) tokens on`,
        this.blockchain.name,
      );
      this.watchingTokenAddresses.set(this.watchingToken[i].address.toLowerCase(), this.watchingToken[i]);
    }
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
      logger.info(
        'Start watching',
        this.watchingWallet[i].name,
        `(${this.watchingWallet[i].address}) address on`,
        this.blockchain.name,
      );
      this.watchingWalletAddresses.set(this.watchingWallet[i].address.toLowerCase(), this.watchingWallet[i]);
    }
  }

  // Update sync
  private async updateSync() {
    let isChanged = false;
    this.stage = getStage();
    const imSync = new ModelSync();
    // We will try to read synced state from database
    if (typeof this.synced.id === 'undefined') {
      const [tmpSyncState] = await imSync.get([{ field: 'blockchainId', value: this.blockchain.id }]);
      if (typeof tmpSyncState === 'undefined') {
        const startPoint = (await this.provider.getBlockNumber()) - this.blockchain.safeConfirmations;
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
      // Only check safe blocks
      if (targetBlock - syncedBlock < this.blockchain.numberOfBlocksToSync) {
        const currentBlockNumber = (await this.provider.getBlockNumber()) - this.blockchain.safeConfirmations;
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
    const logs = await Utilities.TillSuccess<Log[]>(
      async () => {
        return this.provider.getLogs({
          fromBlock,
          toBlock,
          topics: [utils.id('Transfer(address,address,uint256)')],
        });
      },
      2000,
      5,
    );

    logger.info(`${this.blockchain.name} > Found ${logs.length} events in range ${fromBlock} -> ${toBlock}`);

    const imEvent = new ModelEvent();
    // Get log and push the events outside
    for (let i = 0; i < logs.length; i += 1) {
      const log = logs[i];
      const tokenAddress = log.address.toLowerCase();
      // Watching a given wallet for stable deposit
      if (this.watchingTokenAddresses.has(tokenAddress)) {
        const token = this.watchingTokenAddresses.get(tokenAddress);
        const { from, value, to, blockHash, blockNumber, transactionHash, contractAddress, eventId } = parseEvent(log);
        if (token && (await imEvent.isNotExist('eventId', eventId))) {
          if (token.type === EToken.ERC20 && this.watchingWalletAddresses.has(to)) {
            const watchingAddress = this.watchingWalletAddresses.get(to);
            const status =
              watchingAddress?.type === EWatching.Donate ? EProcessingStatus.NewDonate : EProcessingStatus.NewPayment;
            logger.info(`New event, ERC20 transfer ${from} -> ${to} ${value}`);
            await imEvent.create({
              status,
              from,
              to,
              value: BigNum.toHexString(BigNum.from(value)),
              blockHash,
              eventId,
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
          } else if (token.type === EToken.ERC721) {
            logger.info(`New event, ERC721 transfer ${from} -> ${to} ${BigNum.toHexString(BigNum.from(value))}`);
            await imEvent.create({
              status: EProcessingStatus.NftTransfer,
              from,
              to,
              value: BigNum.toHexString(BigNum.from(value)),
              blockHash,
              eventId,
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
    }

    // Update synced block
    const imSync = new ModelSync();
    this.synced.syncedBlock = toBlock;
    await imSync.update({ syncedBlock: toBlock }, [{ field: 'id', value: id }]);
  }

  // Syncing events from blockchain
  private async eventSync() {
    const { id, startBlock, syncedBlock, targetBlock } = this.synced;
    const { numberOfBlocksToSync, numberOfBlocksToWorker } = this.blockchain;
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
      if (fromBlock >= toBlock) {
        logger.info('Skip syncing blocks due to no diff');
        return;
      }
      while (fromBlock < toBlock) {
        // We skip if there diff is too small
        if (fromBlock + 1 === toBlock) {
          break;
        }
        if (fromBlock + numberOfBlocksToWorker <= toBlock) {
          logger.debug(
            this.blockchain.name,
            '> Scanning events from block:',
            fromBlock + 1,
            'to block:',
            fromBlock + numberOfBlocksToWorker,
          );
          await this.eventWorker(id, fromBlock + 1, fromBlock + numberOfBlocksToWorker);
        } else {
          logger.debug(this.blockchain.name, '> Scanning events from block:', fromBlock + 1, 'to block:', toBlock);
          await this.eventWorker(id, fromBlock + 1, toBlock);
        }
        fromBlock += numberOfBlocksToWorker;
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
        })
        .add('oracle processor donate', async () => {
          if (this.stage === 'genesis') {
            const imEvent = new ModelEvent();
            const event = await imEvent.getEventDetail(EProcessingStatus.NewDonate);
            if (typeof event !== 'undefined') {
              logger.debug(this.blockchain.name, '> Start processing event (Donate)', event.jsonData);
              const imAirdrop = new ModelAirdrop();
              await imAirdrop.batchProcessEvent(event);
            }
          }
        });

      // Current watching blockchain is active chain of DKDAO
      if (this.blockchain.chainId === config.activeChainId) {
        if (typeof this.oracleInstance === 'undefined') {
          // Init oracle if not exist
          this.oracleInstance = await Oracle.getInstance(this.blockchain);
        }
        const oracle = this.oracleInstance;
        // Start doing oracle job by sequence
        this.queue
          .add('oracle schedule loot boxes opening', async () => {
            const imOpenSchedule = new ModelOpenSchedule();
            await imOpenSchedule.batchBuy();
          })
          .add('oracle rng observer', async () => {
            if (Date.now() - this.lastReveal >= revealDuration) {
              const imSecret = new ModelSecret();
              if ((await imSecret.countDigest()) <= 10) {
                await oracle.commit(numberOfDigests);
              } else {
                await oracle.reveal();
                this.lastReveal = Date.now();
              }
            } else {
              logger.debug('Skip reveal and commit');
            }
          })
          .add('oracle open loot boxes', async () => {
            await oracle.openBox();
          })
          .add('oracle monitoring nft ownership', async () => {
            const nftOwnership = new ModelNftOwnership();
            await nftOwnership.syncOwnership();
          });
      }

      this.queue.start();
    } else {
      throw new Error("Unexpected error! can't find blockchain data");
    }
  }
}

export default new Blockchain();
