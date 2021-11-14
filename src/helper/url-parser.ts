import { URL } from 'url';
import { IBlockchain } from '../model/model-blockchain';

export interface IBlockchainInfo extends IBlockchain {
  registry: string;
  watching: string;
}

export function getBlockchainInfoFromURL(url: string): Partial<IBlockchainInfo> | undefined {
  try {
    const newUrl = new URL(url);
    const name = newUrl.searchParams.get('name') || 'Unknown blockchain';
    const safeConfirmation = Number.parseInt(newUrl.searchParams.get('safeConfirmation') || '20', 10);
    const numberOfSyncBlock = Number.parseInt(newUrl.searchParams.get('numberOfSyncBlock') || '100', 10);
    const numberOfProcessBlock = Number.parseInt(newUrl.searchParams.get('numberOfProcessBlock') || '20', 10);
    const explorerUrl = newUrl.searchParams.get('explorerUrl') || '';
    const nativeToken = newUrl.searchParams.get('nativeToken') || 'ETH';
    const registry = newUrl.searchParams.get('registry') || '';
    const watching = newUrl.searchParams.get('watching') || '';
    const chainId = Number.parseInt(newUrl.searchParams.get('chainId') || '0', 10);
    return {
      name,
      safeConfirmation,
      numberOfProcessBlock,
      numberOfSyncBlock,
      nativeToken,
      explorerUrl,
      registry,
      watching,
      chainId,
      url: `${newUrl.origin}${newUrl.pathname}`,
    };
  } catch (error) {
    return undefined;
  }
}

export default {
  getBlockchainInfoFromURL,
};
