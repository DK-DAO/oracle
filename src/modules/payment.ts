/* eslint-disable no-await-in-loop */
import { QueueLoop, Utilities } from 'noqueue';
import { v4 as uuidV4 } from 'uuid';
import { ethers, utils } from 'ethers';
import logger from '../helper/logger';
import { ModelSync, ISync } from '../model/model-sync';
import ModelBlockchain, { IBlockchain } from '../model/model-blockchain';
import ModelToken, { EToken, IToken } from '../model/model-token';
import { IWatching, ModelWatching } from '../model/model-watching';
import { parseEvent, BigNum, hexStringToFixedHexString, getLowCaseAddress } from '../helper/utilities';
import { EPaymentStatus, ModelPayment } from '../model/model-payment';

// Log interface
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

// Transfer event
const eventTransfer = utils.id('Transfer(address,address,uint256)');

// Payment event
const eventPayment = utils.id('Payment(address,address,uint256,address)');

export class Blockchain {
  // Blockchain information
  private blockchain: IBlockchain = <any>{};

  // Sync status
  private synced: ISync = <any>{};

  // Instance of queue loop
  private queue: QueueLoop = new QueueLoop({ paddingTime: 1000 });

  // RPC provider
  private provider: ethers.providers.StaticJsonRpcProvider = <ethers.providers.StaticJsonRpcProvider>{};

  // List of watching token
  private watchingToken: IToken[] = [];

  // Watching token address
  private watchingTokenAddresses: Map<string, IToken> = new Map();

  // Watching wallet
  private watchingWallet: IWatching[] = [];

  // Watching wallet address
  private watchingWalletAddresses: Map<string, IWatching> = new Map();

  private topics: any = [];

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
      this.provider = new ethers.providers.StaticJsonRpcProvider(bcData.url);
      return true;
    }
    logger.error('Unable to load blockchain data of, blockchain id:', id);
    return false;
  }

  // Update list of token
  private async updateListToken() {
    const imToken = new ModelToken();
    this.watchingToken = await imToken.getPayable(this.blockchain.id);

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

    // We going to watching for event look like this
    // Event name: Transfer or Payment
    // Topic 1: any
    // Topic 2: watching addresses
    this.topics = [[eventTransfer, eventPayment], null];
    const watchingAddresses = [];

    for (let i = 0; i < this.watchingWallet.length; i += 1) {
      logger.info(
        'Start watching',
        this.watchingWallet[i].name,
        `(${this.watchingWallet[i].address}) address on`,
        this.blockchain.name,
      );
      watchingAddresses.push(hexStringToFixedHexString(this.watchingWallet[i].address));
      this.watchingWalletAddresses.set(this.watchingWallet[i].address.toLowerCase(), this.watchingWallet[i]);
    }
    this.topics.push(watchingAddresses.length > 0 ? watchingAddresses : null);
  }

  // Update sync
  private async updateSync() {
    let isChanged = false;
    const imSync = new ModelSync();
    // We will try to read synced state from database
    if (typeof this.synced.id === 'undefined') {
      const [tmpSyncState] = await imSync.get([{ field: 'blockchainId', value: this.blockchain.id }]);
      if (typeof tmpSyncState === 'undefined') {
        const startPoint = (await this.provider.getBlockNumber()) - this.blockchain.safeConfirmation;
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
      if (targetBlock - syncedBlock < this.blockchain.numberOfSyncBlock) {
        const currentBlockNumber = (await this.provider.getBlockNumber()) - this.blockchain.safeConfirmation;
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
    /** @todo: Warning we might need to split payment and issuance later */
    const rawLogs = await Utilities.TillSuccess<Log[]>(
      async () => {
        return this.provider.getLogs({
          fromBlock,
          toBlock,
          topics: this.topics,
        });
      },
      2000,
      5,
    );

    // We filter necessary logs from raw log
    let logs = rawLogs.filter((i) => this.watchingTokenAddresses.has(i.address.toLowerCase()));
    // Filter all payments that belong to us
    const payments = logs.filter((i) => {
      return i.topics[0] === eventPayment;
    });
    // Get transaction hash list
    const txHashPayments = payments.map((i) => i.transactionHash);
    // Filter
    logs = logs.filter((i) => {
      return i.topics[0] === eventPayment || !txHashPayments.includes(i.transactionHash);
    });

    logger.info(
      `${this.blockchain.name}> Found ${logs.length}/${rawLogs.length} events, ${fromBlock} - ${toBlock} (${(
        (100 * toBlock) /
        this.synced.targetBlock
      ).toFixed(6)} %)`,
    );

    // Get log and push the events outside
    for (let i = 0; i < logs.length; i += 1) {
      const log = logs[i];
      // Emitter address can be token address or DePayRouter
      const emitterAddress = log.address.toLowerCase();
      // Emitter address not in the list
      if (this.watchingTokenAddresses.has(emitterAddress)) {
        // By default emitter is token
        let token = this.watchingTokenAddresses.get(emitterAddress);
        // Check if emitter is DePayRouter
        if (token?.type === EToken.DePayRouter) {
          const realTokenAddress = getLowCaseAddress(log.data);
          if (this.watchingTokenAddresses.has(realTokenAddress)) {
            token = this.watchingTokenAddresses.get(realTokenAddress);
          }
        }
        // Watching token wasn't supporter we will skip
        if (this.watchingTokenAddresses.has(token?.address || '')) {
          const imPayment = new ModelPayment();
          const { from, value, to, blockHash, blockNumber, transactionHash, contractAddress, eventId } =
            parseEvent(log);

          const memo = `${BigNum.from(value)
            .div(10 ** (token?.decimal || 18))
            .toString()} ${token?.symbol}`;
          if (await imPayment.isNotExist('eventId', eventId)) {
            logger.info(`New event, ERC20 transfer ${from} -> ${to} ${memo}`);
            await imPayment.create({
              status: EPaymentStatus.NewPayment,
              sender: from,
              receiver: to,
              value: BigNum.toHexString(BigNum.from(value)),
              blockHash,
              eventId,
              blockNumber,
              transactionHash,
              contractAddress,
              tokenId: token?.id,
              blockchainId: this.blockchain.id,
              issuanceUuid: uuidV4(),
              memo,
            });
          } else {
            logger.error(
              'Ignored event:',
              JSON.stringify({
                eventName: 'Transfer',
                from: utils.getAddress(from),
                to: utils.getAddress(to),
                value,
              }),
            );
          }
        } else {
          logger.error('Token was not supported', token?.address || 'undefined');
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
    const { numberOfSyncBlock, numberOfProcessBlock } = this.blockchain;
    // Check for synced data is good
    if (
      typeof id !== 'undefined' &&
      typeof startBlock !== 'undefined' &&
      typeof syncedBlock !== 'undefined' &&
      typeof targetBlock !== 'undefined'
    ) {
      let fromBlock = syncedBlock;
      // Try to sync each 100 blocks at once
      const toBlock = targetBlock - syncedBlock > numberOfSyncBlock ? syncedBlock + numberOfSyncBlock : targetBlock;
      if (fromBlock + 1 >= toBlock) {
        logger.info('Skip syncing blocks due to no diff');
        return;
      }
      while (fromBlock < toBlock) {
        try {
          if (fromBlock + numberOfProcessBlock <= toBlock) {
            await this.eventWorker(id, fromBlock + 1, fromBlock + numberOfProcessBlock);
          } else {
            await this.eventWorker(id, fromBlock + 1, toBlock);
          }
          fromBlock += numberOfProcessBlock;
        } catch (error) {
          logger.error(`${this.blockchain.name}> Event sync error:`, error);
        }
      }
    }
  }

  // Star observer
  public async start() {
    if (await this.getBlockchainInfo()) {
      await this.updateListToken();
      await this.updateListWatching();

      this.queue.on('error', (name: string, err: Error) => {
        logger.error(`Found error in "${name}":`, err);
      });

      this.queue
        .add('update sync status', async () => {
          await this.updateSync();
        })
        .add('syncing event from blockchain', async () => {
          await this.eventSync();
        })
        .start();
    } else {
      throw new Error("Unexpected error! can't find blockchain data");
    }
  }
}

export default new Blockchain();
