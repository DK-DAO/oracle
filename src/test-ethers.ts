import { ethers } from 'ethers';
import { abi as abiERC20 } from '../artifacts/contracts/libraries/ERC20.sol/ERC20.json';
import { ERC20 } from '../typechain';

const {
  Contract,
  providers: { JsonRpcProvider },
  utils: { id },
} = ethers;

(async () => {
  const wallet = ethers.Wallet.fromMnemonic(
    'dragon ozone rapid reason shell useful outdoor unknown smile decade lift awake',
  );
  const provider = new JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const usdtPeg = <ERC20>new Contract('0x55d398326f99059fF775485246999027B3197955', abiERC20, provider);

  //usdtPeg.on('Transfer', console.log);

  const abi = ['event Transfer(address indexed src, address indexed dst, uint val)'];

  const contract = new Contract('0x55d398326f99059fF775485246999027B3197955', abi, provider);

  // List all token transfers *from* myAddress

  provider.on(
    {
      address: '0x55d398326f99059fF775485246999027B3197955',
      topics: [id('Transfer(address,address,uint256)')],
    },
    console.log,
  );
})();
