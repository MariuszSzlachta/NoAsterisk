import { DomainError } from '#domain/shared/domain-error';
import { generateId } from '#domain/shared/identifier';
import { BudgetPeriod, validateBudgetPeriod } from '#domain/budget/budget-period.vo';

export class Budget {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly name: string,
    public readonly color: string,
    public readonly limitAmount: number,
    public readonly limitCurrency: string,
    public readonly period: BudgetPeriod,
    public readonly categoryIds: readonly string[],
    public readonly createdAt: Date,
    public readonly isArchived: boolean,
  ) {
    if (!id) {
      throw new DomainError('Budget ID cannot be empty');
    }
    if (!workspaceId) {
      throw new DomainError('Budget workspaceId cannot be empty');
    }
    if (!name.trim()) {
      throw new DomainError('Budget name cannot be empty');
    }
    if (name.length > 100) {
      throw new DomainError('Budget name cannot exceed 100 characters');
    }
    if (!color.trim()) {
      throw new DomainError('Budget color cannot be empty');
    }
    if (limitAmount < 0) {
      throw new DomainError('Budget limit amount cannot be negative');
    }
    if (limitCurrency.length !== 3) {
      throw new DomainError('Budget limit currency must be a 3-letter code');
    }
    validateBudgetPeriod(period);
  }

  static create(props: {
    workspaceId: string;
    name: string;
    color: string;
    limitAmount: number;
    limitCurrency: string;
    period: BudgetPeriod;
    categoryIds?: readonly string[];
  }): Budget {
    return new Budget(
      generateId(),
      props.workspaceId,
      props.name.trim(),
      props.color.trim(),
      props.limitAmount,
      props.limitCurrency.toUpperCase(),
      props.period,
      props.categoryIds ?? [],
      new Date(),
      false,
    );
  }

  rename(name: string): Budget {
    return new Budget(
      this.id,
      this.workspaceId,
      name.trim(),
      this.color,
      this.limitAmount,
      this.limitCurrency,
      this.period,
      this.categoryIds,
      this.createdAt,
      this.isArchived,
    );
  }

  updateLimit(amount: number, currency: string): Budget {
    return new Budget(
      this.id,
      this.workspaceId,
      this.name,
      this.color,
      amount,
      currency.toUpperCase(),
      this.period,
      this.categoryIds,
      this.createdAt,
      this.isArchived,
    );
  }

  changePeriod(period: BudgetPeriod): Budget {
    return new Budget(
      this.id,
      this.workspaceId,
      this.name,
      this.color,
      this.limitAmount,
      this.limitCurrency,
      period,
      this.categoryIds,
      this.createdAt,
      this.isArchived,
    );
  }

  changeColor(color: string): Budget {
    return new Budget(
      this.id,
      this.workspaceId,
      this.name,
      color,
      this.limitAmount,
      this.limitCurrency,
      this.period,
      this.categoryIds,
      this.createdAt,
      this.isArchived,
    );
  }

  updateCategoryIds(categoryIds: readonly string[]): Budget {
    return new Budget(
      this.id,
      this.workspaceId,
      this.name,
      this.color,
      this.limitAmount,
      this.limitCurrency,
      this.period,
      categoryIds,
      this.createdAt,
      this.isArchived,
    );
  }

  archive(): Budget {
    if (this.isArchived) {
      return this;
    }
    return new Budget(
      this.id,
      this.workspaceId,
      this.name,
      this.color,
      this.limitAmount,
      this.limitCurrency,
      this.period,
      this.categoryIds,
      this.createdAt,
      true,
    );
  }

  unarchive(): Budget {
    if (!this.isArchived) {
      return this;
    }
    return new Budget(
      this.id,
      this.workspaceId,
      this.name,
      this.color,
      this.limitAmount,
      this.limitCurrency,
      this.period,
      this.categoryIds,
      this.createdAt,
      false,
    );
  }
}
