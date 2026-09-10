import { z } from 'zod';
import { AnonymizationConfig } from '@import-profiles/domain/value-objects/anonymization-config';
import { AnonymizationStrategy } from '@import-profiles/domain/anonymization-strategy.enum';
import { ColumnMapping } from '@import-profiles/domain/value-objects/column-mapping';
import { ParserConfig } from '@import-profiles/domain/value-objects/parser-config';

const columnMappingsSchema = z.array(
  z.object({
    sourceColumn: z.string(),
    targetField: z.string(),
    isRequired: z.boolean(),
  }),
);

const parserConfigSchema = z.object({
  delimiter: z.string(),
  hasHeader: z.boolean(),
  dateFormat: z.string(),
  encoding: z.string(),
});

const anonymizationConfigSchema = z.object({
  fieldsToAnonymize: z.array(z.string()),
  strategy: z.string(),
});
const ANONYMIZATION_STRATEGIES: readonly string[] = Object.values(
  AnonymizationStrategy,
);

export const parseImportProfileValueObjects = (
  columnMappingsValue: unknown,
  parserConfigValue: unknown,
  anonymizationConfigValue: unknown,
): {
  columnMappings: ColumnMapping[];
  parserConfig: ParserConfig;
  anonymizationConfig: AnonymizationConfig;
} => {
  const columnMappings = columnMappingsSchema.safeParse(columnMappingsValue);
  const parserConfig = parserConfigSchema.safeParse(parserConfigValue);
  const anonymizationConfig = anonymizationConfigSchema.safeParse(
    anonymizationConfigValue,
  );
  if (
    !columnMappings.success ||
    !parserConfig.success ||
    !anonymizationConfig.success
  ) {
    throw new Error('Corrupted DB data: invalid import profile configuration');
  }

  const strategyIndex = ANONYMIZATION_STRATEGIES.indexOf(
    anonymizationConfig.data.strategy,
  );
  if (strategyIndex === -1) {
    throw new Error('Corrupted DB data: invalid import profile strategy');
  }
  const strategy = Object.values(AnonymizationStrategy)[strategyIndex];
  if (!strategy) {
    throw new Error('Corrupted DB data: invalid import profile strategy');
  }

  return {
    columnMappings: columnMappings.data.map(
      (mapping) =>
        new ColumnMapping(
          mapping.sourceColumn,
          mapping.targetField,
          mapping.isRequired,
        ),
    ),
    parserConfig: new ParserConfig(
      parserConfig.data.delimiter,
      parserConfig.data.hasHeader,
      parserConfig.data.dateFormat,
      parserConfig.data.encoding,
    ),
    anonymizationConfig: new AnonymizationConfig(
      anonymizationConfig.data.fieldsToAnonymize,
      strategy,
    ),
  };
};
