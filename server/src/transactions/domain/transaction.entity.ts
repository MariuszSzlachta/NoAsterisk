import { DomainError } from '@shared/domain/domain.error';
import { Money } from '@transactions/domain/value-objects/money';
import { isTransactionType } from '@transactions/domain/value-objects/transaction-type.guard';

export enum TransactionType {
  Income = 'Income',
  Expense = 'Expense',
}

export class Transaction {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly money: Money,
    public readonly type: TransactionType,
    public readonly categoryIds: string[],
    public readonly description: string,
    public readonly date: Date,
    public readonly createdAt: Date,
    public readonly contentHash?: string | undefined,
    public readonly importBatchId?: string | undefined,
  ) {
    if (!id) {
      throw new DomainError('Transaction ID cannot be empty');
    }
    if (!workspaceId) {
      throw new DomainError('Transaction workspaceId cannot be empty');
    }
    if (!isTransactionType(type)) {
      throw new DomainError(`Invalid transaction type: ${String(type)}`);
    }
  }

  static create(props: {
    workspaceId: string;
    amount: number;
    currency: string;
    type: TransactionType;
    categoryIds: string[];
    description: string;
    date: Date;
    contentHash?: string;
    importBatchId?: string;
  }): Transaction {
    return new Transaction(
      crypto.randomUUID(),
      props.workspaceId,
      Money.of(props.amount, props.currency),
      props.type,
      props.categoryIds,
      props.description,
      props.date,
      new Date(),
      props.contentHash,
      props.importBatchId,
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
    );
  }

  assignCategory(categoryId: string): Transaction {
    if (this.categoryIds.includes(categoryId)) {
      return this;
    }
    return new Transaction(
      this.id,
      this.workspaceId,
      this.money,
      this.type,
      [...this.categoryIds, categoryId],
      this.description,
      this.date,
      this.createdAt,
      this.contentHash,
      this.importBatchId,
    );
  }

  removeCategory(categoryId: string): Transaction {
    return new Transaction(
      this.id,
      this.workspaceId,
      this.money,
      this.type,
      this.categoryIds.filter((id) => id !== categoryId),
      this.description,
      this.date,
      this.createdAt,
      this.contentHash,
      this.importBatchId,
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
}
