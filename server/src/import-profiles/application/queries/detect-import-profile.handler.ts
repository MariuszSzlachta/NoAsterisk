import { Injectable, Inject } from '@nestjs/common';
import {
  IMPORT_PROFILE_REPOSITORY,
  ImportProfileRepository,
} from '@import-profiles/application/ports/import-profile.repository';
import { ImportProfileResponseDto } from '@import-profiles/application/dto/import-profile-response.dto';
import { ImportProfileResponseMapper } from '@import-profiles/application/mappers/import-profile-response.mapper';

export interface DetectImportProfileQuery {
  workspaceId: string;
  headers: string[];
}

@Injectable()
export class DetectImportProfileHandler {
  constructor(
    @Inject(IMPORT_PROFILE_REPOSITORY)
    private readonly repo: ImportProfileRepository,
  ) {}

  async execute(
    query: DetectImportProfileQuery,
  ): Promise<ImportProfileResponseDto | undefined> {
    const profiles = await this.repo.findByWorkspaceId(query.workspaceId);
    // First-match semantics: returns the first profile whose required columns all appear in headers.
    // When multiple profiles match, order depends on repository insertion order (no explicit sort).
    const match = profiles.find((p) => p.matchesHeaders(query.headers));
    return match ? ImportProfileResponseMapper.toDto(match) : undefined;
  }
}
