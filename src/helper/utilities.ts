import { noCase } from 'no-case';
import cluster from 'cluster';
import crypto from 'crypto';
import { keccak256 } from 'js-sha3';
import { ethers, utils } from 'ethers';
import { BigNumber } from 'bignumber.js';

export interface IParsedEvent {
  blockHash: string;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
}

export function toCamelCase(text: string): string {
  return noCase(text, {
    delimiter: '',
    transform: (part: string, index: number) => {
      const lowerCasePart = part.toLowerCase();
      return index === 0 ? lowerCasePart : `${lowerCasePart[0].toLocaleUpperCase()}${lowerCasePart.substr(1)}`;
    },
  });
}

export function toSnakeCase(text: string): string {
  return noCase(text, {
    delimiter: '_',
    transform: (part: string) => part.toLowerCase(),
  });
}

export function toPascalCase(text: string): string {
  return noCase(text, {
    delimiter: '',
    transform: (part: string) => {
      const lowerCasePart = part.toLowerCase();
      return `${lowerCasePart[0].toLocaleUpperCase()}${lowerCasePart.substr(1)}`;
    },
  });
}

export function objToCamelCase(obj: any): any {
  const entries = Object.entries(obj);
  const remap: any = {};
  for (let i = 0; i < entries.length; i += 1) {
    const [k, v] = entries[i];
    remap[toCamelCase(k)] = v;
  }
  return remap;
}

export function loadWorker(env: Partial<IWoker>) {
  const worker = cluster.fork(env);
  return { id: env.id || -1, name: env.name || 'undefined', pid: worker.process.pid };
}

export interface IWoker {
  id: number;
  pid: number;
  name: string;
}

export function jsToSql(dateTime: Date): string {
  return dateTime.toISOString().slice(0, 19).replace('T', ' ').replace('Z', ' ');
}

export function sqlNow() {
  return jsToSql(new Date());
}

export function timestamp() {
  return Math.round(Date.now());
}

export function buildDigest(): { s: Buffer; h: Buffer } {
  const buf = crypto.randomBytes(32);
  // Write time stampe to last 8 bytes it's implementation of S || t
  buf.writeBigInt64BE(BigInt(timestamp()), 24);

  return {
    s: buf,
    h: Buffer.from(keccak256.create().update(buf).digest()),
  };
}

export function buildDigestArray(size: number) {
  const h = [];
  const s = [];
  const buf = crypto.randomBytes(size * 32);
  for (let i = 0; i < size; i += 1) {
    const j = i * 32;
    buf.writeBigInt64BE(BigInt(timestamp()), j + 24);
    const t = Buffer.alloc(32);
    buf.copy(t, 0, j, j + 32);
    const d = Buffer.from(keccak256.create().update(t).digest());
    s.push(t);
    h.push(d);
    d.copy(buf, j);
  }
  return {
    h,
    s,
    v: buf,
  };
}

export function getLowCaseAddress(hexString: string): string {
  if (utils.isHexString(hexString) && hexString.length >= 42) {
    // Get address from bytes 32
    return `0x${hexString.substr(-40).toLowerCase()}`;
  }
  throw new Error('Input data was not a hex string');
}

export function getChecksumAddress(hexString: string): string {
  if (utils.isHexString(hexString) && hexString.length >= 42) {
    // Get checksum address from bytes 32
    return utils.getAddress(`0x${hexString.substr(-40)}`);
  }
  throw new Error('Input data was not a hex string');
}

export class BigNum {
  public static from(n: BigNumber.Value, base?: number) {
    return new BigNumber(n, base);
  }

  public static fromHexString(i: string): BigNumber {
    return new BigNumber(i.replace(/^0x/gi, ''), 16);
  }

  public static toHexString(b: BigNumber): string {
    const hexStr = b.toString(16);
    return `0x${hexStr.padStart(hexStr.length % 2 === 0 ? hexStr.length : hexStr.length + 1, '0')}`;
  }
}

export function parseEvent(log: ethers.providers.Log): IParsedEvent {
  const { blockHash, transactionHash, blockNumber, topics, data, address } = log;
  // Append data to topic if these data wasn't indexed
  const eventData = [...topics];
  for (let i = 2; i < data.length; i += 64) {
    eventData.push(`0x${data.substr(i, 64)}`);
  }
  const [, from, to, value] = eventData;

  return {
    blockHash,
    contractAddress: address.toString(),
    transactionHash,
    blockNumber,
    from: getLowCaseAddress(from),
    to: getLowCaseAddress(to),
    value: BigNum.from(value).toString(),
  };
}

export function hexToFixedBuffer(inputHexString: string, size: number = 32): Buffer {
  return Buffer.from(inputHexString.replace(/^0x/g, '').padStart(size * 2, '0'), 'hex');
}

export default {
  toCamelCase,
  toSnakeCase,
  toPascalCase,
  loadWorker,
};
