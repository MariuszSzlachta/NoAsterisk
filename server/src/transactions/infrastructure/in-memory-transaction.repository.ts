import { Injectable } from '@nestjs/common';
import { Transaction } from '@transactions/domain/transaction.entity';
import {
  TransactionRepository,
  TransactionFilter,
  TransactionSortField,
} from '@transactions/application/ports/transaction.repository';
import {
  PagedQuery,
  PagedResult,
  SortDirection,
} from '@shared/application/types/paged-query.types';

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

  async findPaged(
    query: PagedQuery<TransactionFilter, TransactionSortField>,
  ): Promise<PagedResult<Transaction>> {
    let items = [...this.store.values()];

    items = this.applyFilters(items, query.filter);
    items = this.applySort(items, query.sort?.field, query.sort?.direction);

    const total = items.length;
    const { page, limit } = query.page;
    const offset = (page - 1) * limit;
    const data = items.slice(offset, offset + limit);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async existsByCategoryId(categoryId: string): Promise<boolean> {
    return [...this.store.values()].some((t) =>
      t.categoryIds.includes(categoryId),
    );
  }

  async existsByContentHash(
    _workspaceId: string,
    contentHash: string,
  ): Promise<boolean> {
    return [...this.store.values()].some((t) => t.contentHash === contentHash);
  }

  async deleteByBatchId(
    _workspaceId: string,
    batchId: string,
  ): Promise<number> {
    let count = 0;
    for (const [id, t] of this.store) {
      if (t.importBatchId === batchId) {
        this.store.delete(id);
        count++;
      }
    }
    return count;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  private applyFilters(
    items: Transaction[],
    filter?: TransactionFilter,
  ): Transaction[] {
    if (!filter) return items;

    return items.filter((t) => {
      if (filter.type && t.type.toLowerCase() !== filter.type) return false;
      if (
        filter.categoryIds &&
        filter.categoryIds.length > 0 &&
        !filter.categoryIds.some((id) => t.categoryIds.includes(id))
      )
        return false;
      if (filter.dateFrom && t.date < filter.dateFrom) return false;
      if (filter.dateTo && t.date > filter.dateTo) return false;
      if (filter.amountMin !== undefined && t.money.amount < filter.amountMin)
        return false;
      if (filter.amountMax !== undefined && t.money.amount > filter.amountMax)
        return false;
      if (
        filter.description &&
        !t.description.toLowerCase().includes(filter.description.toLowerCase())
      )
        return false;
      return true;
    });
  }

  private applySort(
    items: Transaction[],
    field?: TransactionSortField,
    direction?: SortDirection,
  ): Transaction[] {
    if (!field) return items;
    const dir = direction === SortDirection.Asc ? 1 : -1;

    return items.sort((a, b) => {
      switch (field) {
        case 'date':
          return (a.date.getTime() - b.date.getTime()) * dir;
        case 'amount':
          return (a.money.amount - b.money.amount) * dir;
        case 'type':
          return a.type.localeCompare(b.type) * dir;
        case 'createdAt':
          return (a.createdAt.getTime() - b.createdAt.getTime()) * dir;
      }
    });
  }
}
