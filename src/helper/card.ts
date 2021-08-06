export enum ECardRareness {
  L = 6,
  SSR = 5,
  SR = 4,
  R = 3,
  U = 2,
  C = 1,
}

export enum ECardEdition {
  Normal = 0x0000,
  Genesis = 0xffff,
}

export enum ECardType {
  Card = 0,
  LootBoxes = 1,
}

export class Card {
  private buf: Buffer;

  constructor(val: string) {
    if (val.length <= 66 && /^0x[0-9a-f]+$/gi.test(val)) {
      this.buf = Buffer.from(val.replace(/0x/gi, '').padStart(64, '0'), 'hex');
      return;
    }
    throw new Error("Value wasn't in hex string format 0xdeadbeef");
  }

  public setApplicationId(val: bigint): number {
    return this.buf.writeBigUInt64BE(val, 0);
  }

  public getApplicationId(): bigint {
    return this.buf.readBigUInt64BE(0);
  }

  public setEdition(val: ECardEdition): number {
    return this.buf.writeUInt16BE(val, 8);
  }

  public getEdition(): ECardEdition {
    return this.buf.readUInt16BE(8);
  }

  public setGeneration(val: number): number {
    return this.buf.writeUInt16BE(val, 10);
  }

  public getGeneration(): number {
    return this.buf.readUInt16BE(10);
  }

  public setRareness(val: ECardRareness): number {
    return this.buf.writeUInt16BE(val, 12);
  }

  public getRareness(): ECardRareness {
    return this.buf.readUInt16BE(12);
  }

  public setType(val: ECardType): number {
    return this.buf.writeUInt16BE(val, 14);
  }

  public getType(): ECardType {
    return this.buf.readUInt16BE(14);
  }

  public setId(val: bigint): number {
    return this.buf.writeBigUInt64BE(val, 16);
  }

  public getId(): bigint {
    return this.buf.readBigUInt64BE(16);
  }

  public setSerial(val: bigint): number {
    return this.buf.writeBigUInt64BE(val, 24);
  }

  public getSerial(): bigint {
    return this.buf.readBigUInt64BE(24);
  }

  public static from(val: string) {
    return new Card(val);
  }

  public toString(): string {
    return `0x${this.buf.toString('hex').padStart(64, '0')}`;
  }
}

export default Card;
