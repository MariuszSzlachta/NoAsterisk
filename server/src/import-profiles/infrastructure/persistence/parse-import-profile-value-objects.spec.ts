import { AnonymizationStrategy } from '@import-profiles/domain/anonymization-strategy.enum';
import { parseImportProfileValueObjects } from '@import-profiles/infrastructure/persistence/parse-import-profile-value-objects';

const validValues = {
  columnMappings: [
    { sourceColumn: 'Date', targetField: 'date', isRequired: true },
  ],
  parserConfig: {
    delimiter: ',',
    hasHeader: true,
    dateFormat: 'YYYY-MM-DD',
    encoding: 'utf-8',
  },
  anonymizationConfig: {
    fieldsToAnonymize: ['title'],
    strategy: AnonymizationStrategy.Hash,
  },
};

describe('parseImportProfileValueObjects', () => {
  it('reconstructs validated domain value objects', () => {
    const result = parseImportProfileValueObjects(
      validValues.columnMappings,
      validValues.parserConfig,
      validValues.anonymizationConfig,
    );

    expect(result.columnMappings[0]?.targetField).toBe('date');
    expect(result.parserConfig.delimiter).toBe(',');
    expect(result.anonymizationConfig.strategy).toBe(
      AnonymizationStrategy.Hash,
    );
  });

  it('rejects malformed persisted configuration', () => {
    expect(() =>
      parseImportProfileValueObjects(
        null,
        validValues.parserConfig,
        validValues.anonymizationConfig,
      ),
    ).toThrow('Corrupted DB data: invalid import profile configuration');
  });

  it('rejects unknown persisted strategies', () => {
    expect(() =>
      parseImportProfileValueObjects(
        validValues.columnMappings,
        validValues.parserConfig,
        { ...validValues.anonymizationConfig, strategy: 'Unknown' },
      ),
    ).toThrow('Corrupted DB data: invalid import profile strategy');
  });
});
