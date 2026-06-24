import { Injectable, Inject } from '@nestjs/common';
import {
  IMPORT_PROFILE_REPOSITORY,
  ImportProfileRepository,
} from '@import-profiles/application/ports/import-profile.repository';
import { ImportProfileResponseDto } from '@import-profiles/application/dto/import-profile-response.dto';
import { ImportProfileResponseMapper } from '@import-profiles/application/mappers/import-profile-response.mapper';

@Injectable()
export class GetImportProfilesHandler {
  constructor(
    @Inject(IMPORT_PROFILE_REPOSITORY)
    private readonly repo: ImportProfileRepository,
  ) {}

  async execute(workspaceId: string): Promise<ImportProfileResponseDto[]> {
    const profiles = await this.repo.findByWorkspaceId(workspaceId);
    return profiles.map(ImportProfileResponseMapper.toDto);
  }
}
