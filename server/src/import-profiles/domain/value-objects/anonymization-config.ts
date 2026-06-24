import { DomainError } from '@shared/domain/domain.error';
import { AnonymizationStrategy } from '../anonymization-strategy.enum';

export class AnonymizationConfig {
  constructor(
    readonly fieldsToAnonymize: readonly string[],
    readonly strategy: AnonymizationStrategy,
  ) {
    if (fieldsToAnonymize.length === 0) {
      throw new DomainError(
        'AnonymizationConfig must have at least one field to anonymize',
      );
    }
    if (fieldsToAnonymize.some((f) => !f.trim())) {
      throw new DomainError(
        'AnonymizationConfig fieldsToAnonymize cannot contain empty strings',
      );
    }
  }

  equals(other: AnonymizationConfig): boolean {
    if (this.strategy !== other.strategy) return false;
    if (this.fieldsToAnonymize.length !== other.fieldsToAnonymize.length) return false;
    const thisSet = new Set(this.fieldsToAnonymize);
    return other.fieldsToAnonymize.every((f) => thisSet.has(f));
  }
}
