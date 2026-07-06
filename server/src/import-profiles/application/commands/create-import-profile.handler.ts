import { Injectable, Inject } from '@nestjs/common';
import {
  IMPORT_PROFILE_REPOSITORY,
  ImportProfileRepository,
} from '@import-profiles/application/ports/import-profile.repository';
import { ImportProfile } from '@import-profiles/domain/import-profile.entity';
import { ColumnMapping } from '@import-profiles/domain/value-objects/column-mapping';
import { ParserConfig } from '@import-profiles/domain/value-objects/parser-config';
import { AnonymizationConfig } from '@import-profiles/domain/value-objects/anonymization-config';
import { DomainError } from '@budget/domain';
import { ImportProfileResponseDto } from '@import-profiles/application/dto/import-profile-response.dto';
import { ImportProfileResponseMapper } from '@import-profiles/application/mappers/import-profile-response.mapper';
import {
  AnonymizationStrategyDto,
  STRATEGY_FROM_DTO,
} from '@import-profiles/application/mappers/strategy.mapper';

export interface CreateImportProfileCommand {
  workspaceId: string;
  name: string;
  columnMappings: {
    sourceColumn: string;
    targetField: string;
    isRequired: boolean;
  }[];
  parserConfig: {
    delimiter: string;
    hasHeader: boolean;
    dateFormat: string;
    encoding: string;
  };
  anonymizationConfig: {
    fieldsToAnonymize: string[];
    strategy: AnonymizationStrategyDto;
  };
}

@Injectable()
export class CreateImportProfileHandler {
  constructor(
    @Inject(IMPORT_PROFILE_REPOSITORY)
    private readonly repo: ImportProfileRepository,
  ) {}

  async execute(
    command: CreateImportProfileCommand,
  ): Promise<ImportProfileResponseDto> {
    const existing = await this.repo.findByName(
      command.workspaceId,
      command.name,
    );
    if (existing) {
      throw new DomainError(
        `Import profile with name '${command.name}' already exists`,
      );
    }

    const columnMappings = command.columnMappings.map(
      (m) => new ColumnMapping(m.sourceColumn, m.targetField, m.isRequired),
    );
    const parserConfig = new ParserConfig(
      command.parserConfig.delimiter,
      command.parserConfig.hasHeader,
      command.parserConfig.dateFormat,
      command.parserConfig.encoding,
    );
    const anonymizationConfig = new AnonymizationConfig(
      command.anonymizationConfig.fieldsToAnonymize,
      STRATEGY_FROM_DTO[command.anonymizationConfig.strategy],
    );

    const profile = ImportProfile.create({
      workspaceId: command.workspaceId,
      name: command.name,
      columnMappings,
      parserConfig,
      anonymizationConfig,
    });

    const saved = await this.repo.save(profile);
    return ImportProfileResponseMapper.toDto(saved);
  }
}
