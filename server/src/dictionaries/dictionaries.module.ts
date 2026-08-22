import { Module } from '@nestjs/common';
import { DICTIONARY_REPOSITORY } from '@dictionaries/domain/ports/dictionary.repository';
import { InMemoryDictionaryRepository } from '@dictionaries/infrastructure/in-memory-dictionary.repository';
import { PostgresDictionaryRepository } from '@dictionaries/infrastructure/postgres-dictionary.repository';
import { GetAllDictionariesHandler } from '@dictionaries/application/queries/get-all-dictionaries.handler';
import { GetDictionariesByTypeHandler } from '@dictionaries/application/queries/get-dictionaries-by-type.handler';
import { AddEntryHandler } from '@dictionaries/application/commands/add-entry.handler';
import { BulkImportHandler } from '@dictionaries/application/commands/bulk-import.handler';
import { DeleteEntryHandler } from '@dictionaries/application/commands/delete-entry.handler';
import { DictionariesController } from '@dictionaries/presentation/dictionaries.controller';
import { createRepositoryProvider } from '@shared/infrastructure/database/persistence.provider';

@Module({
  controllers: [DictionariesController],
  providers: [
    createRepositoryProvider(
      DICTIONARY_REPOSITORY,
      PostgresDictionaryRepository,
      InMemoryDictionaryRepository,
    ),
    GetAllDictionariesHandler,
    GetDictionariesByTypeHandler,
    AddEntryHandler,
    BulkImportHandler,
    DeleteEntryHandler,
  ],
  exports: [DICTIONARY_REPOSITORY],
})
export class DictionariesModule {}
