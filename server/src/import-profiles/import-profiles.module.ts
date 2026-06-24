import { Module } from '@nestjs/common';
import { IMPORT_PROFILE_REPOSITORY } from '@import-profiles/application/ports/import-profile.repository';
import { InMemoryImportProfileRepository } from '@import-profiles/infrastructure/in-memory-import-profile.repository';
import { CreateImportProfileHandler } from '@import-profiles/application/commands/create-import-profile.handler';
import { UpdateImportProfileHandler } from '@import-profiles/application/commands/update-import-profile.handler';
import { DeleteImportProfileHandler } from '@import-profiles/application/commands/delete-import-profile.handler';
import { GetImportProfilesHandler } from '@import-profiles/application/queries/get-import-profiles.handler';
import { GetImportProfileByIdHandler } from '@import-profiles/application/queries/get-import-profile-by-id.handler';
import { DetectImportProfileHandler } from '@import-profiles/application/queries/detect-import-profile.handler';
import { ImportProfilesController } from '@import-profiles/presentation/import-profiles.controller';

@Module({
  controllers: [ImportProfilesController],
  providers: [
    {
      provide: IMPORT_PROFILE_REPOSITORY,
      useClass: InMemoryImportProfileRepository,
    },
    CreateImportProfileHandler,
    UpdateImportProfileHandler,
    DeleteImportProfileHandler,
    GetImportProfilesHandler,
    GetImportProfileByIdHandler,
    DetectImportProfileHandler,
  ],
  exports: [IMPORT_PROFILE_REPOSITORY],
})
export class ImportProfilesModule {}
