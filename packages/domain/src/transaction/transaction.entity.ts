import { DomainError } from '#domain/shared/domain-error';
import { generateId } from '#domain/shared/identifier';
import { Money } from '#domain/transaction/money.vo';
import { isTransactionType } from '#domain/transaction/transaction-type.guard';

export enum TransactionType {
  Income = 'Income',
  Expense = 'Expense',
  Adjustment = 'Adjustment',
}

export class Transaction {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly accountId: string,
    public readonly money: Money,
    public readonly type: TransactionType,
    public readonly categoryIds: string[],
    public readonly description: string,
    public readonly date: Date,
    public readonly createdAt: Date,
    public readonly contentHash?: string | undefined,
    public readonly importBatchId?: string | undefined,
    public readonly balance?: number | undefined,
  ) {
    if (!id) {
      throw new DomainError('Transaction ID cannot be empty');
    }
    if (!workspaceId) {
      throw new DomainError('Transaction workspaceId cannot be empty');
    }
    if (!accountId) {
      throw new DomainError('Transaction accountId cannot be empty');
    }
    if (!isTransactionType(type)) {
      throw new DomainError(`Invalid transaction type: ${String(type)}`);
    }
    if (type === TransactionType.Adjustment && categoryIds.length > 0) {
      throw new DomainError('Adjustment transactions cannot have categories');
    }
  }

  static create(props: {
    workspaceId: string;
    accountId: string;
    amount: number;
    currency: string;
    type: TransactionType;
    categoryIds: string[];
    description: string;
    date: Date;
    contentHash?: string;
    importBatchId?: string;
    balance?: number;
  }): Transaction {
    return new Transaction(
      generateId(),
      props.workspaceId,
      props.accountId,
      Money.of(props.amount, props.currency),
      props.type,
      props.categoryIds,
      props.description,
      props.date,
      new Date(),
      props.contentHash,
      props.importBatchId,
      props.balance,
    );
  }

  update(props: {
    amount?: number;
    currency?: string;
    type?: TransactionType;
    categoryIds?: string[];
    description?: string;
    date?: Date;
  }): Transaction {
    return new Transaction(
      this.id,
      this.workspaceId,
      this.accountId,
      props.amount !== undefined || props.currency !== undefined
        ? Money.of(
            props.amount ?? this.money.amount,
            props.currency ?? this.money.currency,
          )
        : this.money,
      props.type ?? this.type,
      props.categoryIds ?? this.categoryIds,
      props.description ?? this.description,
      props.date ?? this.date,
      this.createdAt,
      this.contentHash,
      this.importBatchId,
      this.balance,
    );
  }

  assignCategory(categoryId: string): Transaction {
    if (this.categoryIds.includes(categoryId)) {
      return this;
    }
    return new Transaction(
      this.id,
      this.workspaceId,
      this.accountId,
      this.money,
      this.type,
      [...this.categoryIds, categoryId],
      this.description,
      this.date,
      this.createdAt,
      this.contentHash,
      this.importBatchId,
      this.balance,
    );
  }

  removeCategory(categoryId: string): Transaction {
    return new Transaction(
      this.id,
      this.workspaceId,
      this.accountId,
      this.money,
      this.type,
      this.categoryIds.filter((id) => id !== categoryId),
      this.description,
      this.date,
      this.createdAt,
      this.contentHash,
      this.importBatchId,
      this.balance,
    );
  }

  hasCategory(categoryId: string): boolean {
    return this.categoryIds.includes(categoryId);
  }

  isExpense(): boolean {
    return this.type === TransactionType.Expense;
  }

  isIncome(): boolean {
    return this.type === TransactionType.Income;
  }

  isAdjustment(): boolean {
    return this.type === TransactionType.Adjustment;
  }
}
