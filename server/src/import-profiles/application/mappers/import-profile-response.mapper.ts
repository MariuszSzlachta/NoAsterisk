import { ImportProfile } from '@import-profiles/domain/import-profile.entity';
import { ImportProfileResponseDto } from '@import-profiles/application/dto/import-profile-response.dto';
import { AnonymizationStrategy } from '@import-profiles/domain/anonymization-strategy.enum';

const STRATEGY_TO_DTO: Record<
  AnonymizationStrategy,
  'Hash' | 'Mask' | 'Remove'
> = {
  [AnonymizationStrategy.Hash]: 'Hash',
  [AnonymizationStrategy.Mask]: 'Mask',
  [AnonymizationStrategy.Remove]: 'Remove',
};

export class ImportProfileResponseMapper {
  static toDto(entity: ImportProfile): ImportProfileResponseDto {
    return {
      id: entity.id,
      workspaceId: entity.workspaceId,
      name: entity.name,
      columnMappings: entity.columnMappings.map((m) => ({
        sourceColumn: m.sourceColumn,
        targetField: m.targetField,
        isRequired: m.isRequired,
      })),
      parserConfig: {
        delimiter: entity.parserConfig.delimiter,
        hasHeader: entity.parserConfig.hasHeader,
        dateFormat: entity.parserConfig.dateFormat,
        encoding: entity.parserConfig.encoding,
      },
      anonymizationConfig: {
        fieldsToAnonymize: [...entity.anonymizationConfig.fieldsToAnonymize],
        strategy: STRATEGY_TO_DTO[entity.anonymizationConfig.strategy],
      },
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
