import { Workspace } from '@workspaces/domain/workspace.entity';

// ARCH-EXCEPTION: global-scope — workspace repositories resolve tenant roots by workspace identity.

export const WORKSPACE_REPOSITORY = Symbol('WORKSPACE_REPOSITORY');

export interface WorkspaceRepository {
  save(workspace: Workspace): Promise<Workspace>;
  findById(id: string): Promise<Workspace | undefined>;
  readonly delete: (id: string) => Promise<void>;
}
