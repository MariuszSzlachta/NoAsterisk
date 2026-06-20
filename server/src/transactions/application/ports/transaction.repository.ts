import { Transaction } from '@transactions/domain/transaction.entity';
import { PagedQuery, PagedResult } from '@shared/application/types/paged-query.types';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export type TransactionSortField =
  | 'date'
  | 'amount'
  | 'type'
  | 'createdAt';

export interface TransactionFilter {
  type?: string;
  categoryIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  description?: string;
}

export interface TransactionRepository {
  save(transaction: Transaction): Promise<Transaction>;
  findAll(): Promise<Transaction[]>;
  findById(id: string): Promise<Transaction | undefined>;
  findPaged(
    query: PagedQuery<TransactionFilter, TransactionSortField>,
  ): Promise<PagedResult<Transaction>>;
  existsByCategoryId(categoryId: string): Promise<boolean>;
  existsByContentHash(workspaceId: string, contentHash: string): Promise<boolean>;
  deleteByBatchId(workspaceId: string, batchId: string): Promise<number>;
  delete(id: string): Promise<void>;
}
