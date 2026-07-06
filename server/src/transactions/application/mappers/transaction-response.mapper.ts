import { Transaction, TransactionType } from '@budget/domain';
import { TransactionResponseDto } from '@transactions/application/dto/transaction-response.dto';

const TRANSACTION_TYPE_MAP: Record<
  TransactionType,
  TransactionResponseDto['type']
> = {
  [TransactionType.Income]: 'income',
  [TransactionType.Expense]: 'expense',
  [TransactionType.Adjustment]: 'adjustment',
};

export class TransactionResponseMapper {
  static toDto(entity: Transaction): TransactionResponseDto {
    return {
      id: entity.id,
      accountId: entity.accountId,
      amount: entity.money.amount,
      currency: entity.money.currency,
      type: TRANSACTION_TYPE_MAP[entity.type],
      categoryIds: entity.categoryIds,
      description: entity.description,
      date: entity.date.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      balance: entity.balance,
    };
  }
}
