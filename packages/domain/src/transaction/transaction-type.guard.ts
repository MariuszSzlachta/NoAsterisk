import { TransactionType } from '#domain/transaction/transaction.entity';

export const isTransactionType = (value: string): value is TransactionType =>
  Object.values(TransactionType).includes(value as TransactionType);
