import { DomainError } from '@budget/domain';

export class ColumnMapping {
  constructor(
    readonly sourceColumn: string,
    readonly targetField: string,
    readonly isRequired: boolean,
  ) {
    if (!sourceColumn.trim()) {
      throw new DomainError('ColumnMapping sourceColumn cannot be empty');
    }
    if (!targetField.trim()) {
      throw new DomainError('ColumnMapping targetField cannot be empty');
    }
  }

  equals(other: ColumnMapping): boolean {
    return (
      this.sourceColumn === other.sourceColumn &&
      this.targetField === other.targetField &&
      this.isRequired === other.isRequired
    );
  }
}
