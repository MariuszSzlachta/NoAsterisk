import { Transaction, Money, isTransactionType } from '@budget/domain';
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
      record.workspace_id,
      record.account_id,
      Money.of(record.amount, record.currency),
      record.type,
      record.category_ids,
      record.description,
      new Date(record.date),
      new Date(record.created_at),
      record.content_hash,
      record.balance,
    );
  }

  static toPersistence(entity: Transaction): TransactionRecord {
    return {
      id: entity.id,
      workspace_id: entity.workspaceId,
      account_id: entity.accountId,
      amount: entity.money.amount,
      currency: entity.money.currency,
      type: entity.type,
      category_ids: entity.categoryIds,
      description: entity.description,
      date: entity.date.toISOString(),
      created_at: entity.createdAt.toISOString(),
      content_hash: entity.contentHash,
      balance: entity.balance,
    };
  }
}
