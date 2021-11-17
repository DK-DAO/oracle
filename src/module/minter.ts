/* eslint-disable no-await-in-loop */
import { QueueLoop } from 'noqueue';
import config from '../helper/config';
import logger from '../helper/logger';
import ModelBlockchain, { IBlockchain } from '../model/model-blockchain';
import ModelToken, { EToken, IToken } from '../model/model-token';
import Oracle from './lib/oracle';
import ModelNftIssuance from '../model/model-nft-issuance';
import ModelSecret from '../model/model-secret';
import ModelNftOwnership from '../model/model-nft-ownership';

// Reveal duration 30 mins
const revealDuration = 3600000;

// Const number of digests
const numberOfDigests = 20;

export class ModuleMinter {
  // Blockchain information
  private blockchain: IBlockchain = <any>{};

  // Instance of queue loop
  private queue: QueueLoop = new QueueLoop({ paddingTime: 1000 });

  // List of watching token
  private watchingToken: IToken[] = [];

  // Watching token address
  private watchingTokenAddresses: Map<string, IToken> = new Map();

  // Last time we do reveal
  private lastReveal: number = Date.now();

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
      return true;
    }
    logger.error('Unable to load blockchain data of, blockchain id:', chainId);
    return false;
  }

  // Update list of token
  private async updateListToken() {
    const imToken = new ModelToken();
    this.watchingToken = await imToken.get();

    for (let i = 0; i < this.watchingToken.length; i += 1) {
      this.watchingTokenAddresses.set(this.watchingToken[i].address.toLowerCase(), this.watchingToken[i]);
    }
  }

  // Star observer
  public async start() {
    if (await this.getBlockchainInfo()) {
      await this.updateListToken();
      const erc721Tokens = this.watchingToken.filter((e) => e.type === EToken.ERC721);

      this.queue.on('error', (name: string, err: Error) => {
        logger.error(`Found error in "${name}":`, err);
      });

      // Check for active blockchain
      if (erc721Tokens.length > 0) {
        if (config.walletMnemonic.length > 0) {
          const oracle = await Oracle.getInstance(this.blockchain);
          // Start doing oracle job by sequence
          this.queue
            .add('oracle schedule loot boxes opening', async () => {
              const imNftIssuance = new ModelNftIssuance();
              await imNftIssuance.batchBuy();
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
            });
        } else {
          logger.warning('Due to empty mnemonic we will skip oracle operation');
        }

        this.queue.add('oracle monitoring nft ownership', async () => {
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

export default new ModuleMinter();
