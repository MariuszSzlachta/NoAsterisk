import { Injectable } from '@nestjs/common';
import { Transaction } from '@transactions/domain/transaction.entity';
import { TransactionRepository } from '@transactions/application/ports/transaction.repository';

@Injectable()
export class InMemoryTransactionRepository implements TransactionRepository {
  private readonly store = new Map<string, Transaction>();

  async save(transaction: Transaction): Promise<Transaction> {
    this.store.set(transaction.id, transaction);
    return transaction;
  }

  async findAll(): Promise<Transaction[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<Transaction | undefined> {
    return this.store.get(id);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
