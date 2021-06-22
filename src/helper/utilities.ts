import { noCase } from 'no-case';
import cluster from 'cluster';

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

export default {
  toCamelCase,
  toSnakeCase,
  toPascalCase,
  loadWorker,
};
