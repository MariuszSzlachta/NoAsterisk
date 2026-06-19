import { DomainError } from '@shared/domain/domain.error';

export class Money {
  constructor(
    readonly amount: number,
    readonly currency: string,
  ) {
    if (amount < 0) {
      throw new DomainError('Amount cannot be negative');
    }
    if (currency.length !== 3) {
      throw new DomainError('Currency must be a 3-letter code');
    }
  }

  static of(amount: number, currency: string): Money {
    return new Money(amount, currency.toUpperCase());
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new DomainError(
        `Currency mismatch: ${this.currency} vs ${other.currency}`,
      );
    }
  }
}
