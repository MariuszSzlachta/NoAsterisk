import { Module } from '@nestjs/common';
import { WORKSPACE_REPOSITORY } from '@workspaces/domain/ports/workspace.repository';
import { InMemoryWorkspaceRepository } from '@workspaces/infrastructure/in-memory-workspace.repository';

@Module({
  providers: [
    { provide: WORKSPACE_REPOSITORY, useClass: InMemoryWorkspaceRepository },
  ],
  exports: [WORKSPACE_REPOSITORY],
})
export class WorkspacesModule {}
