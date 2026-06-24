import { ImportProfile } from '@import-profiles/domain/import-profile.entity';

export const IMPORT_PROFILE_REPOSITORY = Symbol('IMPORT_PROFILE_REPOSITORY');

export interface ImportProfileRepository {
  save(profile: ImportProfile): Promise<ImportProfile>;
  findById(workspaceId: string, id: string): Promise<ImportProfile | undefined>;
  findByWorkspaceId(workspaceId: string): Promise<ImportProfile[]>;
  findByName(
    workspaceId: string,
    name: string,
  ): Promise<ImportProfile | undefined>;
  delete(workspaceId: string, id: string): Promise<void>;
}
