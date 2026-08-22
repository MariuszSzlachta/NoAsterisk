import { DomainError } from '@budget/domain';
import { DictionaryEntry } from '@dictionaries/domain/dictionary-entry.entity';
import { DictionaryType } from '@dictionaries/domain/dictionary-type.enum';

describe('DictionaryEntry', () => {
  describe('create', () => {
    it('normalizes merchant value to uppercase', () => {
      const entry = DictionaryEntry.create({
        type: DictionaryType.Merchant,
        value: 'biedronka',
      });

      expect(entry.value).toBe('BIEDRONKA');
      expect(entry.type).toBe(DictionaryType.Merchant);
      expect(entry.id).toBeDefined();
      expect(entry.createdAt).toBeInstanceOf(Date);
    });

    it('normalizes city value to uppercase', () => {
      const entry = DictionaryEntry.create({
        type: DictionaryType.City,
        value: 'warszawa',
      });

      expect(entry.value).toBe('WARSZAWA');
    });

    it('normalizes first name to lowercase', () => {
      const entry = DictionaryEntry.create({
        type: DictionaryType.FirstName,
        value: 'Jan',
      });

      expect(entry.value).toBe('jan');
    });

    it('normalizes surname to lowercase', () => {
      const entry = DictionaryEntry.create({
        type: DictionaryType.Surname,
        value: 'Kowalski',
      });

      expect(entry.value).toBe('kowalski');
    });

    it('normalizes phrase to lowercase', () => {
      const entry = DictionaryEntry.create({
        type: DictionaryType.Phrase,
        value: 'Przelew Własny',
      });

      expect(entry.value).toBe('przelew własny');
    });

    it('trims whitespace before normalizing', () => {
      const entry = DictionaryEntry.create({
        type: DictionaryType.Merchant,
        value: '  lidl  ',
      });

      expect(entry.value).toBe('LIDL');
    });
  });

  describe('constructor validation', () => {
    it('throws when id is empty', () => {
      expect(
        () =>
          new DictionaryEntry('', DictionaryType.FirstName, 'jan', new Date()),
      ).toThrow(DomainError);
    });

    it('throws when value is empty', () => {
      expect(
        () =>
          new DictionaryEntry('id-1', DictionaryType.FirstName, '', new Date()),
      ).toThrow(DomainError);
    });

    it('throws when value is only whitespace', () => {
      expect(
        () =>
          new DictionaryEntry(
            'id-1',
            DictionaryType.FirstName,
            '   ',
            new Date(),
          ),
      ).toThrow(DomainError);
    });

    it('throws when value exceeds 255 characters', () => {
      const longValue = 'a'.repeat(256);
      expect(
        () =>
          new DictionaryEntry(
            'id-1',
            DictionaryType.FirstName,
            longValue,
            new Date(),
          ),
      ).toThrow(DomainError);
    });

    it('accepts value of exactly 255 characters', () => {
      const maxValue = 'a'.repeat(255);
      const entry = new DictionaryEntry(
        'id-1',
        DictionaryType.FirstName,
        maxValue,
        new Date(),
      );
      expect(entry.value).toBe(maxValue);
    });

    it('throws when type is invalid', () => {
      expect(
        () =>
          new DictionaryEntry(
            'id-1',
            'InvalidType' as DictionaryType,
            'value',
            new Date(),
          ),
      ).toThrow(DomainError);
    });
  });
});
