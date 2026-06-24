import { Injectable } from '@nestjs/common';
import { ImportProfileRepository } from '@import-profiles/application/ports/import-profile.repository';
import { ImportProfile } from '@import-profiles/domain/import-profile.entity';

@Injectable()
export class InMemoryImportProfileRepository
  implements ImportProfileRepository
{
  private readonly store = new Map<string, ImportProfile>();

  async save(profile: ImportProfile): Promise<ImportProfile> {
    this.store.set(profile.id, profile);
    return profile;
  }

  async findById(
    workspaceId: string,
    id: string,
  ): Promise<ImportProfile | undefined> {
    const profile = this.store.get(id);
    if (!profile || profile.workspaceId !== workspaceId) {
      return undefined;
    }
    return profile;
  }

  async findByWorkspaceId(workspaceId: string): Promise<ImportProfile[]> {
    return [...this.store.values()].filter(
      (p) => p.workspaceId === workspaceId,
    );
  }

  async findByName(
    workspaceId: string,
    name: string,
  ): Promise<ImportProfile | undefined> {
    return [...this.store.values()].find(
      (p) => p.workspaceId === workspaceId && p.name === name,
    );
  }

  async delete(workspaceId: string, id: string): Promise<void> {
    const profile = this.store.get(id);
    if (profile && profile.workspaceId === workspaceId) {
      this.store.delete(id);
    }
  }
}
