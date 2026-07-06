/**
 * ARCH-EXCEPTION: ImportProfile remains in server/ (not extracted to packages/domain/).
 * Reason: ImportProfile depends on complex value objects (AnonymizationConfig, ColumnMapping,
 * ParserConfig) that are tightly coupled to the server-side CSV parsing pipeline. Extracting
 * requires migrating all VOs together — planned for phase 2 of domain extraction.
 */
import { DomainError } from '@budget/domain';
import { AnonymizationConfig } from './value-objects/anonymization-config';
import { ColumnMapping } from './value-objects/column-mapping';
import { ParserConfig } from './value-objects/parser-config';

export class ImportProfile {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly name: string,
    public readonly columnMappings: readonly ColumnMapping[],
    public readonly parserConfig: ParserConfig,
    public readonly anonymizationConfig: AnonymizationConfig,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    if (!id) {
      throw new DomainError('ImportProfile ID cannot be empty');
    }
    if (!workspaceId) {
      throw new DomainError('ImportProfile workspaceId cannot be empty');
    }
    if (!name.trim()) {
      throw new DomainError('ImportProfile name cannot be empty');
    }
    if (name.length > 255) {
      throw new DomainError('ImportProfile name cannot exceed 255 characters');
    }
    if (columnMappings.length === 0) {
      throw new DomainError(
        'ImportProfile must have at least one column mapping',
      );
    }
    const sourceColumns = columnMappings.map((m) => m.sourceColumn);
    if (new Set(sourceColumns).size !== sourceColumns.length) {
      throw new DomainError(
        'ImportProfile columnMappings cannot have duplicate sourceColumn values',
      );
    }
  }

  static create(props: {
    workspaceId: string;
    name: string;
    columnMappings: ColumnMapping[];
    parserConfig: ParserConfig;
    anonymizationConfig: AnonymizationConfig;
  }): ImportProfile {
    const now = new Date();
    return new ImportProfile(
      crypto.randomUUID(),
      props.workspaceId,
      props.name,
      props.columnMappings,
      props.parserConfig,
      props.anonymizationConfig,
      now,
      now,
    );
  }

  update(props: {
    name?: string;
    columnMappings?: ColumnMapping[];
    parserConfig?: ParserConfig;
    anonymizationConfig?: AnonymizationConfig;
  }): ImportProfile {
    return new ImportProfile(
      this.id,
      this.workspaceId,
      props.name ?? this.name,
      props.columnMappings ?? this.columnMappings,
      props.parserConfig ?? this.parserConfig,
      props.anonymizationConfig ?? this.anonymizationConfig,
      this.createdAt,
      new Date(),
    );
  }

  matchesHeaders(headers: string[]): boolean {
    return this.columnMappings
      .filter((m) => m.isRequired)
      .every((m) => headers.includes(m.sourceColumn));
  }
}
