import { Injectable } from '@nestjs/common';
import { DictionaryEntry } from '@dictionaries/domain/dictionary-entry.entity';
import { DictionaryType } from '@dictionaries/domain/dictionary-type.enum';
import { DictionaryRepository } from '@dictionaries/domain/ports/dictionary.repository';

@Injectable()
export class InMemoryDictionaryRepository implements DictionaryRepository {
  private readonly store = new Map<string, DictionaryEntry>();

  async findByType(
    type: DictionaryType,
  ): Promise<ReadonlyArray<DictionaryEntry>> {
    return [...this.store.values()].filter((entry) => entry.type === type);
  }

  async findAll(): Promise<ReadonlyArray<DictionaryEntry>> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<DictionaryEntry | undefined> {
    return this.store.get(id);
  }

  async save(entry: DictionaryEntry): Promise<DictionaryEntry> {
    this.store.set(entry.id, entry);
    return entry;
  }

  async saveBatch(entries: ReadonlyArray<DictionaryEntry>): Promise<number> {
    for (const entry of entries) {
      this.store.set(entry.id, entry);
    }
    return entries.length;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async existsByTypeAndValue(
    type: DictionaryType,
    value: string,
  ): Promise<boolean> {
    return [...this.store.values()].some(
      (entry) => entry.type === type && entry.value === value,
    );
  }

  clear(): void {
    this.store.clear();
  }
}
