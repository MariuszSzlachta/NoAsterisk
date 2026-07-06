import { DomainError } from '@budget/domain';

export class ParserConfig {
  constructor(
    readonly delimiter: string,
    readonly hasHeader: boolean,
    readonly dateFormat: string,
    readonly encoding: string,
  ) {
    if (!delimiter) {
      throw new DomainError('ParserConfig delimiter cannot be empty');
    }
    if (!dateFormat.trim()) {
      throw new DomainError('ParserConfig dateFormat cannot be empty');
    }
    if (!encoding.trim()) {
      throw new DomainError('ParserConfig encoding cannot be empty');
    }
  }

  equals(other: ParserConfig): boolean {
    return (
      this.delimiter === other.delimiter &&
      this.hasHeader === other.hasHeader &&
      this.dateFormat === other.dateFormat &&
      this.encoding === other.encoding
    );
  }
}
