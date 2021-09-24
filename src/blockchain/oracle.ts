/* eslint-disable no-await-in-loop */
import { ethers } from 'ethers';
import { RNG, DuelistKingDistributor, OracleProxy } from '../../typechain';
import { IBlockchain } from '../model/model-blockchain';
import config from '../helper/config';
import logger from '../helper/logger';
import { buildDigestArray } from '../helper/utilities';
import { abi as abiRng } from '../../artifacts/RNG.json';
import { abi as abiOracleProxy } from '../../artifacts/OracleProxy.json';
// eslint-disable-next-line max-len
import { abi as abiDistributor } from '../../artifacts/DuelistKingDistributor.json';
import ModelSecret, { ESecretStatus } from '../model/model-secret';
import { BytesBuffer } from '../helper/bytes-buffer';
import ModelOpenSchedule from '../model/model-open-schedule';
import ModelConfig from '../model/model-config';
import ModelNonceManagement from '../model/model-nonce-management';

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
  private dkOracle: ethers.Wallet[] = [];

  private dkDaoOracle: ethers.Wallet[] = [];

  private bcData: IBlockchain = <IBlockchain>{};

  private contracts: IContractList = <IContractList>{};

  private oracleSelect: number = 0;

  public provider: ethers.providers.StaticJsonRpcProvider = <ethers.providers.StaticJsonRpcProvider>{};

  public dkOracleAddress: string = '';

  constructor() {
    this.dkDaoOracle.push(ethers.Wallet.fromMnemonic(config.walletMnemonic, `m/44'/60'/0'/0/0`));
    // this.dkOracle.push(ethers.Wallet.fromMnemonic(config.walletMnemonic, `m/44'/60'/0'/0/1`));
    // this.dkOracle.push(ethers.Wallet.fromMnemonic(config.walletMnemonic, `m/44'/60'/0'/0/2`));
    // this.dkOracle.push(ethers.Wallet.fromMnemonic(config.walletMnemonic, `m/44'/60'/0'/0/3`));

    // this.dkOracle.push(ethers.Wallet.fromMnemonic(config.walletMnemonic, `m/44'/60'/0'/0/4`));
    // this.dkOracle.push(ethers.Wallet.fromMnemonic(config.walletMnemonic, `m/44'/60'/0'/0/5`));

    this.dkOracle.push(ethers.Wallet.fromMnemonic(config.walletMnemonic, `m/44'/60'/0'/0/6`));
    this.dkOracle.push(ethers.Wallet.fromMnemonic(config.walletMnemonic, `m/44'/60'/0'/0/7`));
  }

  public async connect(bcData: IBlockchain) {
    const imConfig = new ModelConfig();
    const imNonceManagement = new ModelNonceManagement();
    this.bcData = bcData;
    this.provider = new ethers.providers.StaticJsonRpcProvider(bcData.url);
    // Connect wallet to provider
    this.dkDaoOracle = this.dkDaoOracle.map((i) => i.connect(this.provider));
    this.dkOracle = this.dkOracle.map((i) => i.connect(this.provider));

    const contractRNGAddress = await imConfig.getConfig('contractRNG');
    const contractDistributorAddress = await imConfig.getConfig('contractDistributor');
    const contractDuelistKingOracleProxyAddress = await imConfig.getConfig('contractDuelistKingOracleProxy');
    const contractDKDAOOracleAddress = await imConfig.getConfig('contractDKDAOOracle');

    for (let i = 0; i < this.dkOracle.length; i += 1) {
      const oracleAddress = this.dkOracle[i].address;
      const cachedNonce = await imNonceManagement.getNonce(oracleAddress);
      const blockchainNonce = await this.provider.getTransactionCount(oracleAddress);
      // Set max nonce to blockchain
      await imNonceManagement.setNonce(oracleAddress, Math.max(cachedNonce, blockchainNonce));
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
    } else {
      throw new Error('There are no RNG and Distributor in data');
    }
  }

  public static async getInstance(bcData: IBlockchain): Promise<Oracle> {
    const instance = new Oracle();
    await instance.connect(bcData);
    return instance;
  }

  public async openBox() {
    if (this.oracleSelect >= this.dkOracle.length) {
      this.oracleSelect = 0;
    }
    const currentOracle = this.dkOracle[this.oracleSelect];
    const imNonceManagement = new ModelNonceManagement();
    const imOpenSchedule = new ModelOpenSchedule();
    await imOpenSchedule.openLootBox(
      async (campaignId: number, owner: string, numberOfBox: number): Promise<ethers.ContractTransaction> => {
        let estimatedGas = await this.contracts.dkOracleProxy
          .connect(currentOracle)
          .estimateGas.safeCall(
            this.contracts.distributor.address,
            0,
            this.contracts.distributor.interface.encodeFunctionData('openBox', [campaignId, owner, numberOfBox]),
          );
        const currentNonce = await imNonceManagement.getNonce(currentOracle.address);
        logger.info(
          `Forwarding call from ${
            currentOracle.address
          } -> Distributor::openLootBox(), estimated gas: ${estimatedGas.toString()} Gas, nonce: ${currentNonce}`,
        );

        let result;
        // Add more than 10% gas to estimated gas
        estimatedGas = estimatedGas.add(estimatedGas.div(9));
        const estimatedGasPrice = await this.provider.getGasPrice();
        const calculatedGasPrice = estimatedGasPrice.add(estimatedGasPrice.div(2));
        try {
          result = await this.contracts.dkOracleProxy
            .connect(currentOracle)
            .safeCall(
              this.contracts.distributor.address,
              0,
              this.contracts.distributor.interface.encodeFunctionData('openBox', [campaignId, owner, numberOfBox]),
              {
                gasPrice: calculatedGasPrice,
                nonce: currentNonce,
                gasLimit: estimatedGas,
              },
            );
        } catch (e) {
          logger.error('Use the double gas price since', e);
          result = await this.contracts.dkOracleProxy
            .connect(currentOracle)
            .safeCall(
              this.contracts.distributor.address,
              0,
              this.contracts.distributor.interface.encodeFunctionData('openBox', [campaignId, owner, numberOfBox]),
              {
                // Use x2 gas price
                gasPrice: calculatedGasPrice.mul(2),
                nonce: currentNonce,
                gasLimit: estimatedGas,
              },
            );
        }

        logger.info(`Cached next nonce for ${currentOracle.address} is ${currentNonce + 1}`);
        await imNonceManagement.setNonce(currentOracle.address, currentNonce + 1);
        return result;
      },
    );
    this.oracleSelect += 1;
  }

  public async commit(numberOfDigests: number) {
    const digests = buildDigestArray(numberOfDigests);
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
          .connect(this.dkDaoOracle[0])
          .safeCall(
            this.contracts.rng.address,
            0,
            this.contracts.rng.interface.encodeFunctionData('batchCommit', [digests.v]),
          );
      });
      logger.info('Commit', digests.h.length, 'digests to blockchain');
    } catch (err) {
      logger.error(err);
    }
  }

  public async reveal() {
    const imSecret = new ModelSecret();
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
          .connect(this.dkDaoOracle[0])
          .safeCall(this.contracts.rng.address, 0, this.contracts.rng.interface.encodeFunctionData('reveal', [data]));
      }
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
