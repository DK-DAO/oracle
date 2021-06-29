import { ethers } from 'ethers';
import { RNG, DuelistKingDistributor } from '../../typechain';
import ModelBlockchain from '../model/model-blockchain';
import config from './config';
import {} from './utilities';
import { abi as abiRNG } from '../../artifacts/contracts/infrastructure/RNG.sol/RNG.json';
// eslint-disable-next-line max-len
import { abi as abiDistributor } from '../../artifacts/contracts/dk/DuelistKingDistributor.sol/DuelistKingDistributor.json';

export interface IContractList {
  rng: RNG;
  distributor: DuelistKingDistributor;
}

export class Oracle {
  private signer: ethers.Wallet;

  private contracts: IContractList = <IContractList>{};

  constructor() {
    this.signer = ethers.Wallet.fromMnemonic(config.walletMnemonic.trim());
  }

  public async connect(blockchainId: number) {
    const imBlockchain = new ModelBlockchain();
    const [bcData] = await imBlockchain.get([
      {
        field: 'id',
        value: blockchainId,
      },
    ]);
    if (typeof bcData !== 'undefined') {
      this.signer.connect(new ethers.providers.JsonRpcProvider(bcData.url));
    }

    this.contracts.rng = <RNG>new ethers.Contract(config.addressRNG, abiRNG, this.signer.provider);
    this.contracts.distributor = <DuelistKingDistributor>(
      new ethers.Contract(config.addressDuelistKingFairDistributor, abiDistributor, this.signer.provider)
    );
    throw new Error('Can not lookup blockchain data from database');
  }

  public static async getInstance(blockchainId: number): Promise<Oracle> {
    const instance = new Oracle();
    instance.connect(blockchainId);
    return instance;
  }
}

export default Oracle;
