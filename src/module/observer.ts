/* eslint-disable no-await-in-loop */
import { QueueLoop, Utilities } from 'noqueue';
import { v4 as uuidV4 } from 'uuid';
import { ethers, utils } from 'ethers';
import logger from '../helper/logger';
import { ModelSync, ISync } from '../model/model-sync';
import ModelBlockchain, { IBlockchain } from '../model/model-blockchain';
import ModelToken, { EToken, IToken } from '../model/model-token';
import { IWatching, ModelWatching } from '../model/model-watching';
import { parseEvent, BigNum, getLowCaseAddress } from '../helper/utilities';
import ModelPayment, { EPaymentStatus } from '../model/model-payment';
import ModelNftTransfer, { ENftTransferStatus } from '../model/model-nft-transfer';
import ModelNftOwnership from '../model/model-nft-ownership';
import config from '../helper/config';
import { RetryTimeOut, RetryTimes } from '../helper/const';

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

export class ModuleObserver {
  // Blockchain information
  private blockchain: IBlockchain = <any>{};

  // Sync status
  private synced: ISync = <any>{};

  // Instance of queue loop
  private queue: QueueLoop = new QueueLoop({ paddingTime: 2000 });

  // RPC provider
  private provider: ethers.providers.StaticJsonRpcProvider = <ethers.providers.StaticJsonRpcProvider>{};

  // List of watching token
  private watchingToken: IToken[] = [];

  // Watching token address
  private supportedTokens: Map<string, IToken> = new Map();

  // Watching wallet
  private watchingWallet: IWatching[] = [];

  // Watching wallet address
  private watchingWalletAddresses: Map<string, IWatching> = new Map();

  private topics: any = [];

  private async getLogs(fromBlock: number, toBlock: number): Promise<Log[]> {
    return Utilities.TillSuccess<Log[]>(
      async () =>
        this.provider.getLogs({
          fromBlock,
          toBlock,
          topics: this.topics,
        }),
      RetryTimeOut,
      RetryTimes,
    );
  }

  private async getBlockNumber(): Promise<number> {
    return Utilities.TillSuccess<number>(async () => this.provider.getBlockNumber(), RetryTimeOut, RetryTimes);
  }

  // Get blockchain info from env
  private async getBlockchainInfo(): Promise<boolean> {
    const imBlockchain = new ModelBlockchain();
    // Get blockchain Id from process env
    const chainId = typeof process.env.chainId === 'string' ? parseInt(process.env.chainId, 10) : -1;
    const [bcData] = await imBlockchain.get([
      {
        field: 'chainId',
        value: chainId,
      },
    ]);

    if (typeof bcData !== 'undefined') {
      this.blockchain = bcData;
      logger.info('Loading blockchain data:', bcData.name, bcData.chainId);
      this.provider = new ethers.providers.StaticJsonRpcProvider(bcData.url);
      // @todo: remove this in the future, for local network only
      if (this.blockchain.chainId === 911) {
        const imModelSync = new ModelSync();
        await imModelSync.update(
          {
            startBlock: 0,
            syncedBlock: 0,
            targetBlock: 0,
          },
          [{ field: 'blockchainId', value: bcData.id }],
        );
        const knex = imModelSync.getKnex();
        await knex(config.table.payment).del();
        await knex(config.table.nftIssuance).del();
        await knex(config.table.secret).del();
        await knex(config.table.nonceManagement).del();
        await knex(config.table.nftTransfer).del();
        await knex(config.table.nftOwnership).del();
        await knex(config.table.nftResult).del();
      }

      return true;
    }
    logger.error('Unable to load blockchain data of, chain id:', chainId);
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
        'Start subscribe for events from',
        this.watchingToken[i].name,
        `(${this.watchingToken[i].address}) tokens on`,
        this.blockchain.name,
      );
      this.supportedTokens.set(this.watchingToken[i].address.toLowerCase(), this.watchingToken[i]);
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
    this.topics = [[eventTransfer, eventPayment]];
    // const watchingAddresses = [];

    for (let i = 0; i < this.watchingWallet.length; i += 1) {
      logger.info(
        'Start watching',
        this.watchingWallet[i].name,
        `(${this.watchingWallet[i].address}) address on`,
        this.blockchain.name,
      );
      // watchingAddresses.push(hexStringToFixedHexString(this.watchingWallet[i].address));
      this.watchingWalletAddresses.set(this.watchingWallet[i].address.toLowerCase(), this.watchingWallet[i]);
    }
    // this.topics.push(watchingAddresses.length > 0 ? watchingAddresses : null);
  }

  // Update sync
  private async updateSync() {
    let isChanged = false;
    const imSync = new ModelSync();
    // We will try to read synced state from database
    if (typeof this.synced.id === 'undefined') {
      const [tmpSyncState] = await imSync.get([{ field: 'blockchainId', value: this.blockchain.id }]);
      if (typeof tmpSyncState === 'undefined') {
        const startPoint = (await this.getBlockNumber()) - this.blockchain.safeConfirmation;
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
        const currentBlockNumber = (await this.getBlockNumber()) - this.blockchain.safeConfirmation;
        // Re-target
        if (currentBlockNumber > targetBlock) {
          updateData.targetBlock = currentBlockNumber;
          this.synced.targetBlock = currentBlockNumber;
          // Update after re-target
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
    const imPayment = new ModelPayment();
    const imNftTransfer = new ModelNftTransfer();
    // Get logs for given address
    /** @todo: Warning we might need to split payment and issuance later */
    const rawLogs = await this.getLogs(fromBlock, toBlock);

    // We filter necessary logs from raw log
    let logs = rawLogs.filter((i) => this.supportedTokens.has(i.address.toLowerCase()));
    // Get transaction hash list
    const txHashPayments = logs
      .filter((i) => {
        return i.topics[0] === eventPayment;
      })
      .map((i) => i.transactionHash);
    // Get the real address from Payment event
    logs = logs
      .filter((i) => {
        return i.topics[0] === eventPayment || !txHashPayments.includes(i.transactionHash);
      })
      .map((i) => {
        if (i.topics[0] !== eventPayment) {
          return i;
        }
        // If current event is payment event, we're going to replace token address by using the real one
        return {
          ...i,
          address: getLowCaseAddress(i.data),
        };
      });

    logger.info(
      `${this.blockchain.name}> Found ${logs.length}/${rawLogs.length} events, ${fromBlock} - ${toBlock} (${(
        (100 * toBlock) /
        this.synced.targetBlock
      ).toFixed(6)} %)`,
    );

    const paymentList = [];
    const paymentEventIds: string[] = [];
    const nftTransferList = [];
    const nftTransferEventIds: string[] = [];

    // Get log and push the events outside
    for (let i = 0; i < logs.length; i += 1) {
      const log = logs[i];
      // Get token from support token list
      const token = this.supportedTokens.get(log.address.toLowerCase());
      // Watching token wasn't supporter we will skip
      if (typeof token !== 'undefined' && this.supportedTokens.has((token.address || '').toLowerCase())) {
        const { from, value, to, blockHash, blockNumber, transactionHash, contractAddress, eventId } = parseEvent(log);
        const memo = `${BigNum.from(value)
          .div(10 ** (token?.decimal || 18))
          .toString()} ${token?.symbol}`;
        if (token.type !== EToken.ERC721 && this.watchingWalletAddresses.has(to)) {
          // Check for existing payment
          if ((await imPayment.isNotExist('eventId', eventId)) && !paymentEventIds.includes(eventId)) {
            logger.debug(`New event, ERC20 transfer ${from} -> ${to} ${memo}`);
            paymentList.push({
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
            paymentEventIds.push(eventId);
          } else {
            logger.error('Duplicated payment eventId:', eventId, 'txHash:', transactionHash, 'receiver:', to);
          }
        } else if (token.type === EToken.ERC721) {
          // Check for existing transfer
          if ((await imNftTransfer.isNotExist('eventId', eventId)) && !nftTransferEventIds.includes(eventId)) {
            const nftTokenId = BigNum.toHexString(BigNum.from(value));
            logger.debug(`New event, ERC721 transfer ${from} -> ${to} ${nftTokenId}`);
            nftTransferList.push({
              status: ENftTransferStatus.NewNftTransfer,
              tokenId: token.id,
              sender: from,
              receiver: to,
              nftTokenId,
              blockHash,
              eventId,
              blockNumber,
              transactionHash,
              contractAddress,
              blockchainId: this.blockchain.id,
            });
            nftTransferEventIds.push(eventId);
          } else {
            logger.error('Duplicated nft eventId:', eventId, 'txHash:', transactionHash, 'receiver:', to);
          }
        } /* else {
          logger.error(
            'Ignored tx hash:',
            transactionHash,
            JSON.stringify({
              eventName: 'Transfer',
              from: utils.getAddress(from),
              to: utils.getAddress(to),
              value,
            }),
          );
        } */
      } else {
        logger.error('Token was not supported', token?.address || 'undefined');
      }
    }

    // Insert payment event
    if (paymentList.length > 0) {
      await imPayment.getKnex().batchInsert(imPayment.tableName, paymentList);
    }

    // Insert nft transfer event
    if (nftTransferList.length > 0) {
      await imNftTransfer.getKnex().batchInsert(imNftTransfer.tableName, nftTransferList);
    }

    logger.info('Processed:', paymentList.length, 'payment events,', nftTransferList.length, 'NFT transfer events');

    // Update synced block
    const imSync = new ModelSync();
    this.synced.syncedBlock = toBlock;
    await imSync.update({ syncedBlock: toBlock }, [{ field: 'id', value: id }]);
  }

  // Syncing events from blockchain
  private async eventSync() {
    const { id, startBlock, syncedBlock, targetBlock } = this.synced;
    const { numberOfProcessBlock } = this.blockchain;
    // Check for synced data is good
    if (
      typeof id !== 'undefined' &&
      typeof startBlock !== 'undefined' &&
      typeof syncedBlock !== 'undefined' &&
      typeof targetBlock !== 'undefined'
    ) {
      const fromBlock = syncedBlock + 1;
      const toBlock =
        targetBlock - syncedBlock > numberOfProcessBlock ? syncedBlock + numberOfProcessBlock : targetBlock;
      if (toBlock > fromBlock) {
        await this.eventWorker(id, fromBlock, toBlock);
      } else {
        logger.info('Skip syncing blocks due to no diff');
      }
      /*
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
      */
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
        .add('oracle monitoring nft ownership', async () => {
          const nftOwnership = new ModelNftOwnership();
          await nftOwnership.syncOwnership();
        })
        .start();
    } else {
      throw new Error("Unexpected error! can't find blockchain data");
    }
  }
}

export default new ModuleObserver();
