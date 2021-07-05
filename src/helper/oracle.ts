/* eslint-disable no-await-in-loop */
import { ethers } from 'ethers';
import { RNG, DuelistKingDistributor } from '../../typechain';
import ModelBlockchain from '../model/model-blockchain';
import config from './config';
import logger from './logger';
import { buildDigestArray } from './utilities';
import { abi as abiRNG } from '../../artifacts/contracts/infrastructure/RNG.sol/RNG.json';
// eslint-disable-next-line max-len
import { abi as abiDistributor } from '../../artifacts/contracts/dk/DuelistKingDistributor.sol/DuelistKingDistributor.json';
import ModelSecret, { ESecretStatus } from '../model/model-secret';
import { BytesBuffer } from './bytes-buffer';

export interface IContractList {
  rng: RNG;
  distributor: DuelistKingDistributor;
}

export class Oracle {
  private dkOracle: ethers.Wallet;

  private dkDaoOracle: ethers.Wallet;

  private blockchainId: number = config.activeChainId;

  private contracts: IContractList = <IContractList>{};

  constructor() {
    this.dkOracle = ethers.Wallet.fromMnemonic(config.walletMnemonic, `m/44'/60'/0'/0/0`);
    this.dkDaoOracle = ethers.Wallet.fromMnemonic(config.walletMnemonic, `m/44'/60'/0'/0/1`);
  }

  public async connect() {
    const imBlockchain = new ModelBlockchain();
    const [bcData] = await imBlockchain.get([
      {
        field: 'id',
        value: this.blockchainId,
      },
    ]);
    if (typeof bcData !== 'undefined') {
      const provider = new ethers.providers.JsonRpcProvider(bcData.url);
      this.dkDaoOracle.connect(provider);
      this.dkOracle.connect(provider);
      this.contracts.rng = <RNG>new ethers.Contract(config.addressRNG, abiRNG, this.dkDaoOracle);
      this.contracts.distributor = <DuelistKingDistributor>(
        new ethers.Contract(config.addressDuelistKingFairDistributor, abiDistributor, this.dkOracle)
      );
    }
    throw new Error('Can not lookup blockchain data from database');
  }

  public static async getInstance(): Promise<Oracle> {
    const instance = new Oracle();
    instance.connect();
    return instance;
  }

  public async openBox(buyer: string, boxes: number) {
    // For now we only support one campaign
    await this.contracts.distributor.openBox(await this.contracts.distributor.getCampaignIndex(), buyer, boxes);
  }

  public async commit(sizeOfDigests: number) {
    const digests = buildDigestArray(sizeOfDigests);
    const imSecret = new ModelSecret();
    const newRecords = digests.h.map((item: Buffer, index: number) => ({
      blockchainId: this.blockchainId,
      digest: `0x${item.toString('hex')}`,
      secret: `0x${digests.s[index].toString('hex')}`,
    }));
    try {
      const listOfId = await imSecret.batchCommit(newRecords);
      if (Array.isArray(listOfId)) {
        // Try to commit
        await this.contracts.rng.batchCommit(digests.v);
        await imSecret.updateAll({ status: ESecretStatus.Committed }, listOfId);
      } else {
        throw new Error('We can not get the list of id');
      }
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
      const { secret, index } = await this.contracts.rng.getDataByDigest(secretRecord.digest);
      // Make sure that this record never had been used before
      if (secret === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        const data = BytesBuffer.newInstance()
          .writeAddress(this.contracts.distributor.address)
          .writeUint256(index)
          .writeUint256(secret)
          .invoke();
        await this.contracts.rng.reveal(data);
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
}

export default Oracle;
