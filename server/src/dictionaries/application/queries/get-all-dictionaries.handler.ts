import { Injectable, Inject } from '@nestjs/common';
import {
  DICTIONARY_REPOSITORY,
  DictionaryRepository,
} from '@dictionaries/domain/ports/dictionary.repository';
import { DictionaryResponseDto } from '@dictionaries/application/dto/dictionary-response.dto';
import { DictionaryResponseMapper } from '@dictionaries/application/mappers/dictionary-response.mapper';

@Injectable()
export class GetAllDictionariesHandler {
  constructor(
    @Inject(DICTIONARY_REPOSITORY)
    private readonly repo: DictionaryRepository,
  ) {}

  async execute(): Promise<DictionaryResponseDto> {
    const entries = await this.repo.findAll();
    return DictionaryResponseMapper.toGroupedDto(entries);
  }
}
