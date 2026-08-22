import { DictionaryEntry } from '@dictionaries/domain/dictionary-entry.entity';
import { DictionaryType } from '@dictionaries/domain/dictionary-type.enum';
import { DictionaryRepository } from '@dictionaries/domain/ports/dictionary.repository';

export const buildMockRepo = (): jest.Mocked<DictionaryRepository> => ({
  findByType: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  saveBatch: jest.fn(),
  delete: jest.fn(),
  existsByTypeAndValue: jest.fn(),
});

export const buildEntry = (
  overrides: Partial<{ id: string; type: DictionaryType; value: string }> = {},
): DictionaryEntry =>
  new DictionaryEntry(
    overrides.id ?? 'entry-1',
    overrides.type ?? DictionaryType.FirstName,
    overrides.value ?? 'jan',
    new Date('2025-01-01'),
  );
