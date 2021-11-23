/* eslint-disable no-await-in-loop */
import { ethers } from 'ethers';
import { RNG, DuelistKingDistributor, OracleProxy } from '../../../typechain';
import { IBlockchain } from '../../model/model-blockchain';
import config from '../../helper/config';
import logger from '../../helper/logger';
import { buildDigestArray, craftProof } from '../../helper/utilities';
import { abi as abiRng } from '../../../artifacts/RNG.json';
import { abi as abiOracleProxy } from '../../../artifacts/OracleProxy.json';
// eslint-disable-next-line max-len
import { abi as abiDistributor } from '../../../artifacts/DuelistKingDistributor.json';
import ModelSecret, { ESecretStatus } from '../../model/model-secret';
import { BytesBuffer } from '../../helper/bytes-buffer';
import ModelNftIssuance from '../../model/model-nft-issuance';
import ModelConfig from '../../model/model-config';
import ModelNonceManagement from '../../model/model-nonce-management';

const zero32Bytes = '0x0000000000000000000000000000000000000000000000000000000000000000';

export interface IContractList {
  dkOracleProxy: OracleProxy;
  dkdaoOracleProxy: OracleProxy;
  rng: RNG;
  distributor: DuelistKingDistributor;
}

// Safe duration
// const safeDuration = 120000;

export class Oracle {
  private executors: ethers.Wallet[] = [];

  private dkOracle: ethers.Wallet;

  private infraOracle: ethers.Wallet;

  private bcData: IBlockchain = <IBlockchain>{};

  private contracts: IContractList = <IContractList>{};

  private nextExecutor: number = 0;

  private nonceManagement: ModelNonceManagement;

  public provider: ethers.providers.StaticJsonRpcProvider = <ethers.providers.StaticJsonRpcProvider>{};

  public dkOracleAddress: string = '';

  constructor(blockchainData: IBlockchain) {
    for (let i = 0; i < 4; i += 1) {
      this.executors.push(ethers.Wallet.fromMnemonic(config.walletMnemonic, `m/44'/60'/0'/0/${i}`));
    }
    this.infraOracle = new ethers.Wallet(config.privOracleDkdao);
    this.dkOracle = new ethers.Wallet(config.privOracleDuelistKing);
    this.nonceManagement = new ModelNonceManagement(blockchainData);
  }

  private async getNonce(address: string): Promise<number> {
    return this.nonceManagement.getNonce(address);
  }

  private async setNonce(address: string, nonce: number) {
    await this.nonceManagement.setNonce(address, nonce);
    // We put it here to make sure we won't forget
    this.nextExecutor += 1;
  }

  private getExecutor() {
    if (this.nextExecutor >= this.executors.length) {
      this.nextExecutor = 0;
    }
    return this.executors[this.nextExecutor];
  }

  public async connect(bcData: IBlockchain) {
    const imConfig = new ModelConfig();
    this.bcData = bcData;
    this.provider = new ethers.providers.StaticJsonRpcProvider(bcData.url);
    this.executors = this.executors.map((e) => e.connect(this.provider));
    // Connect wallet to provider
    this.infraOracle = this.infraOracle.connect(this.provider);
    this.dkOracle = this.dkOracle.connect(this.provider);

    const contractRNGAddress = await imConfig.getConfig('contractRNG');
    const contractDistributorAddress = await imConfig.getConfig('contractDistributor');
    const contractDuelistKingOracleProxyAddress = await imConfig.getConfig('contractDuelistKingOracleProxy');
    const contractDKDAOOracleAddress = await imConfig.getConfig('contractDKDAOOracle');
    for (let i = 0; i < this.executors.length; i += 1) {
      const executorAddress = this.executors[i].address;
      const cachedNonce = await this.getNonce(executorAddress);
      const blockchainNonce = await this.provider.getTransactionCount(executorAddress);
      // Set max nonce to nonce management
      await this.setNonce(executorAddress, Math.max(cachedNonce, blockchainNonce));
    }

    if (
      typeof contractDistributorAddress === 'string' &&
      typeof contractRNGAddress === 'string' &&
      typeof contractDuelistKingOracleProxyAddress === 'string' &&
      typeof contractDKDAOOracleAddress === 'string'
    ) {
      // RNG
      this.contracts.rng = <RNG>new ethers.Contract(contractRNGAddress, abiRng, this.provider);
      // Distributor
      this.contracts.distributor = <DuelistKingDistributor>(
        new ethers.Contract(contractDistributorAddress, abiDistributor, this.provider)
      );
      // Oracle proxy of Duelist King
      this.contracts.dkOracleProxy = <OracleProxy>(
        new ethers.Contract(contractDuelistKingOracleProxyAddress, abiOracleProxy, this.provider)
      );
      // Oracle Proxy of DKDAO
      this.contracts.dkdaoOracleProxy = <OracleProxy>(
        new ethers.Contract(contractDKDAOOracleAddress, abiOracleProxy, this.provider)
      );
      logger.info('Connected for given blockchain data');
    } else {
      throw new Error('There are no RNG and Distributor in data');
    }
  }

  public static async getInstance(bcData: IBlockchain): Promise<Oracle> {
    const instance = new Oracle(bcData);
    await instance.connect(bcData);
    return instance;
  }

  public async mintBoxes() {
    const currentExecutor = this.getExecutor();
    const imNftIssuance = new ModelNftIssuance();
    await imNftIssuance.mintBoxes(
      async (phase: number, owner: string, numberOfBox: number): Promise<ethers.ContractTransaction> => {
        let estimatedGas = await this.contracts.dkOracleProxy
          .connect(currentExecutor)
          .estimateGas.safeCall(
            await craftProof(this.dkOracle, this.contracts.dkOracleProxy),
            this.contracts.distributor.address,
            0,
            this.contracts.distributor.interface.encodeFunctionData('mintBoxes', [owner, numberOfBox, phase]),
          );
        const currentNonce = await this.getNonce(currentExecutor.address);
        logger.info(
          `Forwarding call from ${
            currentExecutor.address
          } -> Distributor::mintBoxes(), estimated gas: ${estimatedGas.toString()} Gas, nonce: ${currentNonce}`,
        );

        let result;
        // Add more than 10% gas to estimated gas
        estimatedGas = estimatedGas.add(estimatedGas.div(9));
        const estimatedGasPrice = await this.provider.getGasPrice();
        const calculatedGasPrice = estimatedGasPrice.add(estimatedGasPrice.div(2));
        try {
          result = await this.contracts.dkOracleProxy
            .connect(currentExecutor)
            .safeCall(
              await craftProof(this.dkOracle, this.contracts.dkOracleProxy),
              this.contracts.distributor.address,
              0,
              this.contracts.distributor.interface.encodeFunctionData('mintBoxes', [owner, numberOfBox, phase]),
              {
                gasPrice: calculatedGasPrice,
                nonce: currentNonce,
                gasLimit: estimatedGas,
              },
            );
        } catch (e) {
          logger.error('Use the double gas price since', e);
          result = await await this.contracts.dkOracleProxy
            .connect(currentExecutor)
            .safeCall(
              await craftProof(this.dkOracle, this.contracts.dkOracleProxy),
              this.contracts.distributor.address,
              0,
              this.contracts.distributor.interface.encodeFunctionData('mintBoxes', [owner, numberOfBox, phase]),
              {
                gasPrice: calculatedGasPrice.mul(2),
                nonce: currentNonce,
                gasLimit: estimatedGas,
              },
            );
        }

        logger.info(`Cached next nonce for ${currentExecutor.address} is ${currentNonce + 1}`);
        await this.setNonce(currentExecutor.address, currentNonce + 1);
        return result;
      },
    );
  }

  public async commit(numberOfDigests: number) {
    const digests = buildDigestArray(numberOfDigests);
    const currentExecutor = this.getExecutor();
    const currentNonce = await this.getNonce(currentExecutor.address);
    const imSecret = new ModelSecret();
    const newRecords = digests.h.map((item: Buffer, index: number) => ({
      blockchainId: this.bcData.id,
      digest: `0x${item.toString('hex')}`,
      secret: `0x${digests.s[index].toString('hex')}`,
      status: ESecretStatus.Committed,
    }));
    try {
      await imSecret.batchCommit(newRecords, async () => {
        await this.contracts.dkdaoOracleProxy
          .connect(currentExecutor)
          .safeCall(
            await craftProof(this.infraOracle, this.contracts.dkdaoOracleProxy),
            this.contracts.rng.address,
            0,
            this.contracts.rng.interface.encodeFunctionData('batchCommit', [digests.v]),
            { nonce: currentNonce },
          );
      });
      logger.info('Commit', digests.h.length, 'digests to blockchain');
      await this.setNonce(currentExecutor.address, currentNonce + 1);
    } catch (err) {
      logger.error(err);
    }
  }

  public async reveal() {
    const imSecret = new ModelSecret();
    const currentExecutor = this.getExecutor();
    const currentNonce = await this.getNonce(currentExecutor.address);
    // Lookup digest from database
    const secretRecord = await imSecret.getDigest();
    if (secretRecord) {
      // Lookup for record from blockchain
      const { secret, index, digest } = await this.contracts.rng.getDataByDigest(secretRecord.digest);
      if (digest === zero32Bytes) {
        logger.error("This digest don't exist on blockchain, we will mark this value as an error");
        // We're going to to mark it as revealed anyway
        await imSecret.update(
          {
            status: ESecretStatus.Error,
          },
          [
            {
              field: 'id',
              value: secretRecord.id,
            },
          ],
        );
        return;
      }
      logger.debug(`Reveal status: ${secret === zero32Bytes ? 'no' : 'yes'}, index: ${index}, for digest: ${digest}`);
      // Make sure that this record never had been used before
      if (secret === zero32Bytes) {
        const data = BytesBuffer.newInstance()
          .writeAddress(this.contracts.distributor.address)
          .writeUint256(index)
          .writeUint256(secretRecord.secret)
          .invoke();
        await this.contracts.dkdaoOracleProxy
          .connect(currentExecutor)
          .safeCall(
            await craftProof(this.infraOracle, this.contracts.dkdaoOracleProxy),
            this.contracts.rng.address,
            0,
            this.contracts.rng.interface.encodeFunctionData('reveal', [data]),
            {
              nonce: currentNonce,
            },
          );
      }
      await this.setNonce(currentExecutor.address, currentNonce + 1);
      // We're going to to mark it as revealed anyway
      await imSecret.update(
        {
          status: ESecretStatus.Revealed,
        },
        [
          {
            field: 'id',
            value: secretRecord.id,
          },
        ],
      );
    } else {
      logger.error('There are no remaining secret record in our database');
    }
  }

  public async getRNGProgress() {
    return this.contracts.rng.getProgress();
  }
}

export default Oracle;
