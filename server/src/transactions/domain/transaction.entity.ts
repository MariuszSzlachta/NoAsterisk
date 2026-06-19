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
    public readonly money: Money,
    public readonly type: TransactionType,
    public readonly category: string,
    public readonly description: string,
    public readonly date: Date,
    public readonly createdAt: Date,
  ) {
    if (!id) {
      throw new DomainError('Transaction ID cannot be empty');
    }
    if (!isTransactionType(type)) {
      throw new DomainError(`Invalid transaction type: ${type}`);
    }
    if (!category.trim()) {
      throw new DomainError('Category cannot be empty');
    }
  }

  static create(props: {
    amount: number;
    currency: string;
    type: TransactionType;
    category: string;
    description: string;
    date: Date;
  }): Transaction {
    return new Transaction(
      crypto.randomUUID(),
      Money.of(props.amount, props.currency),
      props.type,
      props.category,
      props.description,
      props.date,
      new Date(),
    );
  }

  isExpense(): boolean {
    return this.type === TransactionType.Expense;
  }

  isIncome(): boolean {
    return this.type === TransactionType.Income;
  }
}
