import { BigNumber } from 'ethers';
import { hexToFixedBuffer } from './utilities';

export class BytesBuffer {
  private tmpBuf: Buffer[] = [];

  public static newInstance(): BytesBuffer {
    return new BytesBuffer();
  }

  public writeAddress(address: string): BytesBuffer {
    this.tmpBuf.push(Buffer.from(address.replace(/^0x/g, ''), 'hex'));
    return this;
  }

  public writeUint256(uint256: string | Buffer | BigNumber | Number): BytesBuffer {
    let b: Buffer = Buffer.alloc(32);
    if (typeof uint256 === 'string') {
      b = hexToFixedBuffer(uint256);
    } else if (typeof uint256 === 'number') {
      b = hexToFixedBuffer(uint256.toString(16));
    } else if (BigNumber.isBigNumber(uint256)) {
      b = hexToFixedBuffer(uint256.toHexString());
    } else if (Buffer.isBuffer(uint256)) {
      b = hexToFixedBuffer(uint256.toString('hex'));
    }
    this.tmpBuf.push(b);
    return this;
  }

  public invoke(): Buffer {
    return Buffer.concat(this.tmpBuf);
  }
}

export default BytesBuffer;
