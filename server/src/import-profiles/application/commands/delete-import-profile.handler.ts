import { Injectable, Inject } from '@nestjs/common';
import {
  IMPORT_PROFILE_REPOSITORY,
  ImportProfileRepository,
} from '@import-profiles/application/ports/import-profile.repository';

export interface DeleteImportProfileCommand {
  workspaceId: string;
  id: string;
}

@Injectable()
export class DeleteImportProfileHandler {
  constructor(
    @Inject(IMPORT_PROFILE_REPOSITORY)
    private readonly repo: ImportProfileRepository,
  ) {}

  async execute(command: DeleteImportProfileCommand): Promise<boolean> {
    const existing = await this.repo.findById(command.workspaceId, command.id);
    if (!existing) {
      return false;
    }
    await this.repo.delete(command.workspaceId, command.id);
    return true;
  }
}
