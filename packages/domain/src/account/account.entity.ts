import { DomainError } from '#domain/shared/domain-error';
import { generateId } from '#domain/shared/identifier';

export class Account {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly name: string,
    public readonly type: string,
    public readonly currency: string,
    public readonly initialBalance: number,
    public readonly createdAt: Date,
    public readonly isArchived: boolean,
  ) {
    if (!id) {
      throw new DomainError('Account ID cannot be empty');
    }
    if (!workspaceId) {
      throw new DomainError('Account workspaceId cannot be empty');
    }
    if (!name.trim()) {
      throw new DomainError('Account name cannot be empty');
    }
    if (name.length > 100) {
      throw new DomainError('Account name cannot exceed 100 characters');
    }
    if (!type.trim()) {
      throw new DomainError('Account type cannot be empty');
    }
    if (currency.length !== 3) {
      throw new DomainError('Currency must be a 3-letter code');
    }
  }

  static create(props: {
    workspaceId: string;
    name: string;
    type: string;
    currency: string;
    initialBalance?: number;
  }): Account {
    return new Account(
      generateId(),
      props.workspaceId,
      props.name.trim(),
      props.type.trim(),
      props.currency.toUpperCase(),
      props.initialBalance ?? 0,
      new Date(),
      false,
    );
  }

  rename(name: string): Account {
    return new Account(
      this.id,
      this.workspaceId,
      name.trim(),
      this.type,
      this.currency,
      this.initialBalance,
      this.createdAt,
      this.isArchived,
    );
  }

  archive(): Account {
    if (this.isArchived) {
      return this;
    }
    return new Account(
      this.id,
      this.workspaceId,
      this.name,
      this.type,
      this.currency,
      this.initialBalance,
      this.createdAt,
      true,
    );
  }

  unarchive(): Account {
    if (!this.isArchived) {
      return this;
    }
    return new Account(
      this.id,
      this.workspaceId,
      this.name,
      this.type,
      this.currency,
      this.initialBalance,
      this.createdAt,
      false,
    );
  }
}
