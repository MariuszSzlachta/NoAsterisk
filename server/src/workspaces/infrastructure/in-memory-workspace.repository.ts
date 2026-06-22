import { Injectable } from '@nestjs/common';
import { Workspace } from '@workspaces/domain/workspace.entity';
import { WorkspaceRepository } from '@workspaces/domain/ports/workspace.repository';

@Injectable()
export class InMemoryWorkspaceRepository implements WorkspaceRepository {
  private readonly store = new Map<string, Workspace>();

  async save(workspace: Workspace): Promise<Workspace> {
    this.store.set(workspace.id, workspace);
    return workspace;
  }

  async findById(id: string): Promise<Workspace | undefined> {
    return this.store.get(id);
  }
}
