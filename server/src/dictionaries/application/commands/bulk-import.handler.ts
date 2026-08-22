import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  DICTIONARY_REPOSITORY,
  DictionaryRepository,
} from '@dictionaries/domain/ports/dictionary.repository';
import { DictionaryEntry } from '@dictionaries/domain/dictionary-entry.entity';
import { DictionaryType } from '@dictionaries/domain/dictionary-type.enum';
import { isDictionaryType } from '@dictionaries/domain/dictionary-type.guard';
import { BulkImportResultDto } from '@dictionaries/application/dto/bulk-import-result.dto';

export interface BulkImportCommand {
  type: string;
  values: readonly string[];
}

@Injectable()
export class BulkImportHandler {
  constructor(
    @Inject(DICTIONARY_REPOSITORY)
    private readonly repo: DictionaryRepository,
  ) {}

  async execute(command: BulkImportCommand): Promise<BulkImportResultDto> {
    if (!isDictionaryType(command.type)) {
      throw new BadRequestException('Invalid dictionary type');
    }
    const type: DictionaryType = command.type;

    const existingEntries = await this.repo.findByType(type);
    const existingValues = new Set(existingEntries.map((e) => e.value));

    const entries: DictionaryEntry[] = [];
    const seenValues = new Set<string>();
    let skipped = 0;

    for (const rawValue of command.values) {
      const entry = DictionaryEntry.create({ type, value: rawValue });

      if (seenValues.has(entry.value) || existingValues.has(entry.value)) {
        skipped++;
        continue;
      }

      seenValues.add(entry.value);
      entries.push(entry);
    }

    const imported =
      entries.length > 0 ? await this.repo.saveBatch(entries) : 0;

    return { imported, skipped };
  }
}
