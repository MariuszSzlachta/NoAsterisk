import { Workspace } from '@workspaces/domain/workspace.entity';

export const WORKSPACE_REPOSITORY = Symbol('WORKSPACE_REPOSITORY');

export interface WorkspaceRepository {
  save(workspace: Workspace): Promise<Workspace>;
  findById(id: string): Promise<Workspace | undefined>;
}
