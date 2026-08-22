import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DictionaryEntry } from '@dictionaries/domain/dictionary-entry.entity';
import { DictionaryType } from '@dictionaries/domain/dictionary-type.enum';
import { isDictionaryType } from '@dictionaries/domain/dictionary-type.guard';
import { DictionaryRepository } from '@dictionaries/domain/ports/dictionary.repository';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { dictionaries } from '@shared/infrastructure/database/schema';

@Injectable()
export class PostgresDictionaryRepository implements DictionaryRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async findByType(
    type: DictionaryType,
  ): Promise<ReadonlyArray<DictionaryEntry>> {
    const rows = await this.db
      .select()
      .from(dictionaries)
      .where(eq(dictionaries.type, type));
    return rows
      .map((r) => this.toDomain(r))
      .filter((e): e is DictionaryEntry => e !== undefined);
  }

  async findAll(): Promise<ReadonlyArray<DictionaryEntry>> {
    const rows = await this.db.select().from(dictionaries);
    return rows
      .map((r) => this.toDomain(r))
      .filter((e): e is DictionaryEntry => e !== undefined);
  }

  async findById(id: string): Promise<DictionaryEntry | undefined> {
    const rows = await this.db
      .select()
      .from(dictionaries)
      .where(eq(dictionaries.id, id));
    return this.toDomain(rows[0]);
  }

  async save(entry: DictionaryEntry): Promise<DictionaryEntry> {
    await this.db
      .insert(dictionaries)
      .values({
        id: entry.id,
        type: entry.type,
        value: entry.value,
        createdAt: entry.createdAt,
      })
      .onConflictDoNothing();
    return entry;
  }

  async saveBatch(entries: ReadonlyArray<DictionaryEntry>): Promise<number> {
    if (entries.length === 0) return 0;

    const result = await this.db
      .insert(dictionaries)
      .values(
        entries.map((entry) => ({
          id: entry.id,
          type: entry.type,
          value: entry.value,
          createdAt: entry.createdAt,
        })),
      )
      .onConflictDoNothing();

    return result.rowCount ?? entries.length;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(dictionaries).where(eq(dictionaries.id, id));
  }

  async existsByTypeAndValue(
    type: DictionaryType,
    value: string,
  ): Promise<boolean> {
    const rows = await this.db
      .select({ id: dictionaries.id })
      .from(dictionaries)
      .where(and(eq(dictionaries.type, type), eq(dictionaries.value, value)))
      .limit(1);
    return rows.length > 0;
  }

  private toDomain(
    row: typeof dictionaries.$inferSelect | undefined,
  ): DictionaryEntry | undefined {
    if (!row) return undefined;
    if (!isDictionaryType(row.type)) return undefined;
    return new DictionaryEntry(row.id, row.type, row.value, row.createdAt);
  }
}
