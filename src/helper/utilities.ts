import { noCase } from 'no-case';
import cluster from 'cluster';
import crypto from 'crypto';
import { keccak256 } from 'js-sha3';

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
  return dateTime.toISOString().slice(0, 19).replace('T', ' ');
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

export default {
  toCamelCase,
  toSnakeCase,
  toPascalCase,
  loadWorker,
};
