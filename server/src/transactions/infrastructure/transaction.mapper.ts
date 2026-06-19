import { Transaction } from '@transactions/domain/transaction.entity';
import { Money } from '@transactions/domain/value-objects/money';
import { isTransactionType } from '@transactions/domain/value-objects/transaction-type.guard';
import { TransactionRecord } from '@transactions/infrastructure/transaction.record';

export class TransactionMapper {
  static toDomain(record: TransactionRecord): Transaction {
    if (!isTransactionType(record.type)) {
      throw new Error(
        `Invalid transaction type in persistence: ${record.type}`,
      );
    }

    return new Transaction(
      record.id,
      Money.of(record.amount, record.currency),
      record.type,
      record.category_ids,
      record.description,
      new Date(record.date),
      new Date(record.created_at),
    );
  }

  static toPersistence(entity: Transaction): TransactionRecord {
    return {
      id: entity.id,
      amount: entity.money.amount,
      currency: entity.money.currency,
      type: entity.type,
      category_ids: entity.categoryIds,
      description: entity.description,
      date: entity.date.toISOString(),
      created_at: entity.createdAt.toISOString(),
    };
  }
}
