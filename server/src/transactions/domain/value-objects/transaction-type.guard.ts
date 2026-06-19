import { TransactionType } from '@transactions/domain/transaction.entity';

export const isTransactionType = (value: string): value is TransactionType =>
  Object.values(TransactionType).includes(value as TransactionType);
