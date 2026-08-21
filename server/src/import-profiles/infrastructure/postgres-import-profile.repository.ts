import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { ImportProfile } from '@import-profiles/domain/import-profile.entity';
import { ImportProfileRepository } from '@import-profiles/application/ports/import-profile.repository';
import { ColumnMapping } from '@import-profiles/domain/value-objects/column-mapping';
import { ParserConfig } from '@import-profiles/domain/value-objects/parser-config';
import { AnonymizationConfig } from '@import-profiles/domain/value-objects/anonymization-config';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { importProfiles } from '@shared/infrastructure/database/schema';

@Injectable()
export class PostgresImportProfileRepository implements ImportProfileRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async save(profile: ImportProfile): Promise<ImportProfile> {
    await this.db
      .insert(importProfiles)
      .values({
        id: profile.id,
        workspaceId: profile.workspaceId,
        name: profile.name,
        bankName: null,
        columnMapping: profile.columnMappings,
        parserConfig: profile.parserConfig,
        anonymizationConfig: profile.anonymizationConfig,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      })
      .onConflictDoUpdate({
        target: importProfiles.id,
        set: {
          name: profile.name,
          columnMapping: profile.columnMappings,
          parserConfig: profile.parserConfig,
          anonymizationConfig: profile.anonymizationConfig,
          updatedAt: profile.updatedAt,
        },
      });
    return profile;
  }

  async findById(
    workspaceId: string,
    id: string,
  ): Promise<ImportProfile | undefined> {
    const rows = await this.db
      .select()
      .from(importProfiles)
      .where(
        and(
          eq(importProfiles.workspaceId, workspaceId),
          eq(importProfiles.id, id),
        ),
      );
    return this.toDomain(rows[0]);
  }

  async findByWorkspaceId(workspaceId: string): Promise<ImportProfile[]> {
    const rows = await this.db
      .select()
      .from(importProfiles)
      .where(eq(importProfiles.workspaceId, workspaceId));
    return rows
      .map((r) => this.toDomain(r))
      .filter((p): p is ImportProfile => p !== undefined);
  }

  async findByName(
    workspaceId: string,
    name: string,
  ): Promise<ImportProfile | undefined> {
    const rows = await this.db
      .select()
      .from(importProfiles)
      .where(
        and(
          eq(importProfiles.workspaceId, workspaceId),
          eq(importProfiles.name, name),
        ),
      );
    return this.toDomain(rows[0]);
  }

  async delete(workspaceId: string, id: string): Promise<void> {
    await this.db
      .delete(importProfiles)
      .where(
        and(
          eq(importProfiles.workspaceId, workspaceId),
          eq(importProfiles.id, id),
        ),
      );
  }

  private toDomain(
    row: typeof importProfiles.$inferSelect | undefined,
  ): ImportProfile | undefined {
    if (!row) return undefined;
    return new ImportProfile(
      row.id,
      row.workspaceId,
      row.name,
      row.columnMapping as ColumnMapping[],
      row.parserConfig as ParserConfig,
      row.anonymizationConfig as AnonymizationConfig,
      row.createdAt,
      row.updatedAt,
    );
  }
}
