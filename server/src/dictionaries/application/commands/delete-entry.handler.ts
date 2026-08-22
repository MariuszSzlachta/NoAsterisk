import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  DICTIONARY_REPOSITORY,
  DictionaryRepository,
} from '@dictionaries/domain/ports/dictionary.repository';

export interface DeleteEntryCommand {
  id: string;
}

@Injectable()
export class DeleteEntryHandler {
  constructor(
    @Inject(DICTIONARY_REPOSITORY)
    private readonly repo: DictionaryRepository,
  ) {}

  async execute(command: DeleteEntryCommand): Promise<void> {
    const existing = await this.repo.findById(command.id);
    if (!existing) {
      throw new NotFoundException(`Dictionary entry ${command.id} not found`);
    }
    await this.repo.delete(command.id);
  }
}
