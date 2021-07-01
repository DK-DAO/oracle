import { EventEmitter } from 'events';
import { Knex } from 'knex';
import { Connector } from './connector';

export class Transaction extends EventEmitter {
  private knexInstance: Knex;

  private transaction: Knex.Transaction | null = null;

  constructor(dbInstanceName: string = '__default__') {
    super();
    this.knexInstance = Connector.getInstance(dbInstanceName);
  }

  public async get(): Promise<Knex.Transaction> {
    if (this.transaction === null) {
      // Auto start if transaction wasn't started
      this.transaction = await this.knexInstance.transaction();
    }
    return this.transaction;
  }

  public async rollback(): Promise<boolean> {
    let err: Error;
    if (this.transaction === null) {
      err = new Error('Transaction was null');
      this.emit('error', err);
      throw err;
    }
    await this.transaction.rollback();
    if (this.transaction.isCompleted()) {
      this.emit('rollback', this.transaction);
      this.transaction = null;
      return true;
    }
    err = new Error('Not able to rollback given transaction');
    this.emit('error', err);
    throw err;
  }

  public async commit(): Promise<boolean> {
    let err: Error;
    if (this.transaction === null) {
      err = new Error('Transaction was null');
      this.emit('error', err);
      throw err;
    }
    await this.transaction.commit();
    if (this.transaction.isCompleted()) {
      this.emit('commit', this.transaction);
      this.transaction = null;
      return true;
    }
    err = new Error('Not able to commit transaction');
    this.emit('error', err);
    throw err;
  }
}

export default Transaction;
