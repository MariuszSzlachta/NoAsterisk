import {
  Injectable,
  Inject,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  DICTIONARY_REPOSITORY,
  DictionaryRepository,
} from '@dictionaries/domain/ports/dictionary.repository';
import { DictionaryEntry } from '@dictionaries/domain/dictionary-entry.entity';
import { DictionaryType } from '@dictionaries/domain/dictionary-type.enum';
import { isDictionaryType } from '@dictionaries/domain/dictionary-type.guard';

export interface AddEntryCommand {
  type: string;
  value: string;
}

@Injectable()
export class AddEntryHandler {
  constructor(
    @Inject(DICTIONARY_REPOSITORY)
    private readonly repo: DictionaryRepository,
  ) {}

  async execute(
    command: AddEntryCommand,
  ): Promise<{ id: string; value: string }> {
    if (!isDictionaryType(command.type)) {
      throw new BadRequestException('Invalid dictionary type');
    }
    const type: DictionaryType = command.type;
    const entry = DictionaryEntry.create({ type, value: command.value });

    const exists = await this.repo.existsByTypeAndValue(
      entry.type,
      entry.value,
    );
    if (exists) {
      throw new ConflictException(
        `Entry already exists in dictionary '${entry.type}'`,
      );
    }

    const saved = await this.repo.save(entry);
    return { id: saved.id, value: saved.value };
  }
}
