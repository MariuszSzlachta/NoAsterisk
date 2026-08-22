import { DictionaryEntry } from '@dictionaries/domain/dictionary-entry.entity';
import { DictionaryType } from '@dictionaries/domain/dictionary-type.enum';
import { DictionaryResponseDto } from '@dictionaries/application/dto/dictionary-response.dto';

export class DictionaryResponseMapper {
  static toGroupedDto(
    entries: ReadonlyArray<DictionaryEntry>,
  ): DictionaryResponseDto {
    const firstNames: string[] = [];
    const surnames: string[] = [];
    const merchants: string[] = [];
    const cities: string[] = [];
    const phrases: string[] = [];

    for (const entry of entries) {
      switch (entry.type) {
        case DictionaryType.FirstName:
          firstNames.push(entry.value);
          break;
        case DictionaryType.Surname:
          surnames.push(entry.value);
          break;
        case DictionaryType.Merchant:
          merchants.push(entry.value);
          break;
        case DictionaryType.City:
          cities.push(entry.value);
          break;
        case DictionaryType.Phrase:
          phrases.push(entry.value);
          break;
      }
    }

    return {
      firstNames,
      surnames,
      merchants,
      cities,
      phrases,
    };
  }

  static toValuesList(
    entries: ReadonlyArray<DictionaryEntry>,
  ): readonly string[] {
    return entries.map((entry) => entry.value);
  }
}
