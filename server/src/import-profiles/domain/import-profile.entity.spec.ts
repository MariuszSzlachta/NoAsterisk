import { ImportProfile } from './import-profile.entity';
import { ColumnMapping } from './value-objects/column-mapping';
import { ParserConfig } from './value-objects/parser-config';
import { AnonymizationConfig } from './value-objects/anonymization-config';
import { AnonymizationStrategy } from './anonymization-strategy.enum';
import { DomainError } from '@budget/domain';

const buildColumnMapping = (
  overrides?: Partial<{
    sourceColumn: string;
    targetField: string;
    isRequired: boolean;
  }>,
): ColumnMapping =>
  new ColumnMapping(
    overrides?.sourceColumn ?? 'Date',
    overrides?.targetField ?? 'date',
    overrides?.isRequired ?? true,
  );

const buildParserConfig = (): ParserConfig =>
  new ParserConfig(',', true, 'YYYY-MM-DD', 'utf-8');

const buildAnonymizationConfig = (): AnonymizationConfig =>
  new AnonymizationConfig(['title'], AnonymizationStrategy.Hash);

const buildCreateProps = () => ({
  workspaceId: 'ws-1',
  name: 'My Bank Profile',
  columnMappings: [buildColumnMapping()],
  parserConfig: buildParserConfig(),
  anonymizationConfig: buildAnonymizationConfig(),
});

describe('ImportProfile', () => {
  describe('create', () => {
    it('creates profile with generated id and timestamps', () => {
      const profile = ImportProfile.create(buildCreateProps());

      expect(profile.id).toBeDefined();
      expect(profile.workspaceId).toBe('ws-1');
      expect(profile.name).toBe('My Bank Profile');
      expect(profile.columnMappings).toHaveLength(1);
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.updatedAt).toBeInstanceOf(Date);
    });

    it('throws when workspaceId is empty', () => {
      expect(() =>
        ImportProfile.create({ ...buildCreateProps(), workspaceId: '' }),
      ).toThrow(DomainError);
    });

    it('throws when name is empty', () => {
      expect(() =>
        ImportProfile.create({ ...buildCreateProps(), name: '  ' }),
      ).toThrow(DomainError);
    });

    it('throws when columnMappings is empty', () => {
      expect(() =>
        ImportProfile.create({ ...buildCreateProps(), columnMappings: [] }),
      ).toThrow(DomainError);
    });
  });

  describe('constructor invariants', () => {
    it('throws when id is empty', () => {
      expect(
        () =>
          new ImportProfile(
            '',
            'ws-1',
            'name',
            [buildColumnMapping()],
            buildParserConfig(),
            buildAnonymizationConfig(),
            new Date(),
            new Date(),
          ),
      ).toThrow(DomainError);
    });

    it('throws when workspaceId is empty', () => {
      expect(
        () =>
          new ImportProfile(
            'id-1',
            '',
            'name',
            [buildColumnMapping()],
            buildParserConfig(),
            buildAnonymizationConfig(),
            new Date(),
            new Date(),
          ),
      ).toThrow(DomainError);
    });

    it('throws when name is empty', () => {
      expect(
        () =>
          new ImportProfile(
            'id-1',
            'ws-1',
            '  ',
            [buildColumnMapping()],
            buildParserConfig(),
            buildAnonymizationConfig(),
            new Date(),
            new Date(),
          ),
      ).toThrow(DomainError);
    });

    it('throws when columnMappings is empty array', () => {
      expect(
        () =>
          new ImportProfile(
            'id-1',
            'ws-1',
            'name',
            [],
            buildParserConfig(),
            buildAnonymizationConfig(),
            new Date(),
            new Date(),
          ),
      ).toThrow(DomainError);
    });

    it('throws when columnMappings has duplicate sourceColumn', () => {
      expect(
        () =>
          new ImportProfile(
            'id-1',
            'ws-1',
            'name',
            [
              new ColumnMapping('Date', 'date', true),
              new ColumnMapping('Date', 'startDate', false),
            ],
            buildParserConfig(),
            buildAnonymizationConfig(),
            new Date(),
            new Date(),
          ),
      ).toThrow(DomainError);
    });

    it('throws when name exceeds 255 characters', () => {
      expect(
        () =>
          new ImportProfile(
            'id-1',
            'ws-1',
            'a'.repeat(256),
            [buildColumnMapping()],
            buildParserConfig(),
            buildAnonymizationConfig(),
            new Date(),
            new Date(),
          ),
      ).toThrow(DomainError);
    });
  });

  describe('update', () => {
    it('returns new instance with updated name and new updatedAt', () => {
      const original = ImportProfile.create(buildCreateProps());
      const updated = original.update({ name: 'New Name' });

      expect(updated.id).toBe(original.id);
      expect(updated.workspaceId).toBe(original.workspaceId);
      expect(updated.name).toBe('New Name');
      expect(updated.columnMappings).toBe(original.columnMappings);
      expect(updated.parserConfig).toBe(original.parserConfig);
      expect(updated.anonymizationConfig).toBe(original.anonymizationConfig);
      expect(updated.createdAt).toBe(original.createdAt);
    });

    it('throws when updating name to whitespace', () => {
      const profile = ImportProfile.create(buildCreateProps());
      expect(() => profile.update({ name: '  ' })).toThrow(DomainError);
    });

    it('propagates all fields when updating only parserConfig', () => {
      const original = ImportProfile.create(buildCreateProps());
      const newParser = new ParserConfig(';', false, 'DD/MM/YYYY', 'utf-8');
      const updated = original.update({ parserConfig: newParser });

      expect(updated.name).toBe(original.name);
      expect(updated.columnMappings).toBe(original.columnMappings);
      expect(updated.anonymizationConfig).toBe(original.anonymizationConfig);
      expect(updated.parserConfig).toBe(newParser);
    });
  });

  describe('matchesHeaders', () => {
    it('returns true when all required mappings have matching headers', () => {
      const profile = ImportProfile.create({
        ...buildCreateProps(),
        columnMappings: [
          new ColumnMapping('Date', 'date', true),
          new ColumnMapping('Amount', 'amount', true),
          new ColumnMapping('Note', 'note', false),
        ],
      });

      expect(profile.matchesHeaders(['Date', 'Amount', 'Extra'])).toBe(true);
    });

    it('returns false when a required mapping is missing from headers', () => {
      const profile = ImportProfile.create({
        ...buildCreateProps(),
        columnMappings: [
          new ColumnMapping('Date', 'date', true),
          new ColumnMapping('Amount', 'amount', true),
        ],
      });

      expect(profile.matchesHeaders(['Date', 'Other'])).toBe(false);
    });

    it('ignores optional mappings not present in headers', () => {
      const profile = ImportProfile.create({
        ...buildCreateProps(),
        columnMappings: [
          new ColumnMapping('Date', 'date', true),
          new ColumnMapping('Optional', 'opt', false),
        ],
      });

      expect(profile.matchesHeaders(['Date'])).toBe(true);
    });
  });
});

describe('ColumnMapping', () => {
  it('throws when sourceColumn is empty', () => {
    expect(() => new ColumnMapping('', 'date', true)).toThrow(DomainError);
  });

  it('throws when targetField is empty', () => {
    expect(() => new ColumnMapping('Date', '  ', true)).toThrow(DomainError);
  });

  describe('equals', () => {
    it('returns true when all values are the same', () => {
      const a = new ColumnMapping('Date', 'date', true);
      const b = new ColumnMapping('Date', 'date', true);
      expect(a.equals(b)).toBe(true);
    });

    it('returns false when a value differs', () => {
      const a = new ColumnMapping('Date', 'date', true);
      const b = new ColumnMapping('Date', 'date', false);
      expect(a.equals(b)).toBe(false);
    });
  });
});

describe('ParserConfig', () => {
  it('throws when delimiter is empty', () => {
    expect(() => new ParserConfig('', true, 'YYYY-MM-DD', 'utf-8')).toThrow(
      DomainError,
    );
  });

  it('throws when dateFormat is empty', () => {
    expect(() => new ParserConfig(',', true, '  ', 'utf-8')).toThrow(
      DomainError,
    );
  });

  it('throws when encoding is empty', () => {
    expect(() => new ParserConfig(',', true, 'YYYY-MM-DD', '  ')).toThrow(
      DomainError,
    );
  });

  describe('equals', () => {
    it('returns true when all values are the same', () => {
      const a = new ParserConfig(',', true, 'YYYY-MM-DD', 'utf-8');
      const b = new ParserConfig(',', true, 'YYYY-MM-DD', 'utf-8');
      expect(a.equals(b)).toBe(true);
    });

    it('returns false when a value differs', () => {
      const a = new ParserConfig(',', true, 'YYYY-MM-DD', 'utf-8');
      const b = new ParserConfig(';', true, 'YYYY-MM-DD', 'utf-8');
      expect(a.equals(b)).toBe(false);
    });
  });
});

describe('AnonymizationConfig', () => {
  it('throws when fieldsToAnonymize is empty', () => {
    expect(
      () => new AnonymizationConfig([], AnonymizationStrategy.Hash),
    ).toThrow(DomainError);
  });

  it('throws when fieldsToAnonymize contains empty string', () => {
    expect(
      () => new AnonymizationConfig(['title', ''], AnonymizationStrategy.Mask),
    ).toThrow(DomainError);
  });

  describe('equals', () => {
    it('returns true when all values are the same', () => {
      const a = new AnonymizationConfig(['title'], AnonymizationStrategy.Hash);
      const b = new AnonymizationConfig(['title'], AnonymizationStrategy.Hash);
      expect(a.equals(b)).toBe(true);
    });

    it('returns false when a value differs', () => {
      const a = new AnonymizationConfig(['title'], AnonymizationStrategy.Hash);
      const b = new AnonymizationConfig(['title'], AnonymizationStrategy.Mask);
      expect(a.equals(b)).toBe(false);
    });
  });
});
