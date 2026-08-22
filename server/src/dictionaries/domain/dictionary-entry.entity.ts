import { DomainError } from '@budget/domain';
import { DictionaryType } from '@dictionaries/domain/dictionary-type.enum';
import { isDictionaryType } from '@dictionaries/domain/dictionary-type.guard';

export class DictionaryEntry {
  constructor(
    readonly id: string,
    readonly type: DictionaryType,
    readonly value: string,
    readonly createdAt: Date,
  ) {
    if (!id) throw new DomainError('DictionaryEntry ID is required');
    if (!isDictionaryType(type))
      throw new DomainError('DictionaryEntry type is invalid');
    if (!value || !value.trim())
      throw new DomainError('DictionaryEntry value is required');
    if (value.length > 255)
      throw new DomainError('DictionaryEntry value too long');
  }

  static create(props: {
    type: DictionaryType;
    value: string;
  }): DictionaryEntry {
    const normalized = DictionaryEntry.normalize(props.type, props.value);
    return new DictionaryEntry(
      crypto.randomUUID(),
      props.type,
      normalized,
      new Date(),
    );
  }

  private static normalize(type: DictionaryType, value: string): string {
    const trimmed = value.trim();
    switch (type) {
      case DictionaryType.Merchant:
      case DictionaryType.City:
        return trimmed.toUpperCase();
      case DictionaryType.FirstName:
      case DictionaryType.Surname:
      case DictionaryType.Phrase:
        return trimmed.toLowerCase();
    }
  }
}
