/* eslint-disable no-await-in-loop */
import { ethers } from 'ethers';
import { RNG, DuelistKingDistributor } from '../../typechain';
import { IBlockchain } from '../model/model-blockchain';
import config from '../helper/config';
import logger from '../helper/logger';
import { buildDigestArray } from '../helper/utilities';
import { abi as abiRng } from '../../artifacts/contracts/infrastructure/RNG.sol/RNG.json';
// eslint-disable-next-line max-len
import { abi as abiDistributor } from '../../artifacts/contracts/dk/DuelistKingDistributor.sol/DuelistKingDistributor.json';
import ModelSecret, { ESecretStatus } from '../model/model-secret';
import { BytesBuffer } from '../helper/bytes-buffer';
import ModelOpenSchedule from '../model/model-open-schedule';

const zero32Bytes = '0x0000000000000000000000000000000000000000000000000000000000000000';

export interface IContractList {
  rng: RNG;
  distributor: DuelistKingDistributor;
}

export class Oracle {
  private dkOracle: ethers.Wallet;

  private dkDaoOracle: ethers.Wallet;

  private bcData: IBlockchain = <IBlockchain>{};

  private contracts: IContractList = <IContractList>{};

  public provider: ethers.providers.JsonRpcProvider = <ethers.providers.JsonRpcProvider>{};

  public dkOracleAddress: string = '';

  constructor() {
    this.dkOracle = ethers.Wallet.fromMnemonic(config.walletMnemonic, `m/44'/60'/0'/0/3`);
    this.dkDaoOracle = ethers.Wallet.fromMnemonic(config.walletMnemonic, `m/44'/60'/0'/0/1`);
  }

  public async connect(bcData: IBlockchain) {
    this.bcData = bcData;
    this.provider = new ethers.providers.JsonRpcProvider(bcData.url);
    this.dkDaoOracle = this.dkDaoOracle.connect(this.provider);
    this.dkOracle = this.dkOracle.connect(this.provider);

    this.dkOracleAddress = this.dkOracle.address;
    this.contracts.rng = <RNG>new ethers.Contract(config.addressRng, abiRng, this.dkDaoOracle);
    this.contracts.distributor = <DuelistKingDistributor>(
      new ethers.Contract(config.addressDuelistKingFairDistributor, abiDistributor, this.dkOracle)
    );
    logger.debug(`DKDAO Oracle: ${this.dkDaoOracle.address}, DK Oracle: ${this.dkOracle.address}`);
    logger.debug(`DKDAO RNG: ${this.contracts.rng.address}, DK Distributor: ${this.contracts.distributor.address}`);
  }

  public static async getInstance(bcData: IBlockchain): Promise<Oracle> {
    const instance = new Oracle();
    await instance.connect(bcData);
    return instance;
  }

  public async openBox() {
    const imOpenSchedule = new ModelOpenSchedule();
    imOpenSchedule.openLootBox(
      async (campaignId: number, owner: string, numberOfBox: number): Promise<ethers.ContractTransaction> => {
        return this.contracts.distributor.openBox(campaignId, owner, numberOfBox);
      },
    );
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
        await this.contracts.rng.batchCommit(digests.v);
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

  public async getRNGProgess() {
    return this.contracts.rng.getProgess();
  }
}

export default Oracle;
