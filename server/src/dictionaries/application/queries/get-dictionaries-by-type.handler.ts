import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  DICTIONARY_REPOSITORY,
  DictionaryRepository,
} from '@dictionaries/domain/ports/dictionary.repository';
import { isDictionaryType } from '@dictionaries/domain/dictionary-type.guard';
import { DictionaryResponseMapper } from '@dictionaries/application/mappers/dictionary-response.mapper';

@Injectable()
export class GetDictionariesByTypeHandler {
  constructor(
    @Inject(DICTIONARY_REPOSITORY)
    private readonly repo: DictionaryRepository,
  ) {}

  async execute(type: string): Promise<readonly string[]> {
    if (!isDictionaryType(type)) {
      throw new BadRequestException('Invalid dictionary type');
    }
    const entries = await this.repo.findByType(type);
    return DictionaryResponseMapper.toValuesList(entries);
  }
}
