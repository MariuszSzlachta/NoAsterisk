import { Injectable, Inject } from '@nestjs/common';
import { CategoryUsagePort } from '@categories/application/ports/category-usage.port';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from '@transactions/application/ports/transaction.repository';

@Injectable()
export class CategoryUsageAdapter implements CategoryUsagePort {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly repo: TransactionRepository,
  ) {}

  async isCategoryInUse(categoryId: string): Promise<boolean> {
    return this.repo.existsByCategoryId(categoryId);
  }
}
