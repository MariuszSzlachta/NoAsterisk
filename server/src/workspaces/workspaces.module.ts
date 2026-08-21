import { Module } from '@nestjs/common';
import { WORKSPACE_REPOSITORY } from '@workspaces/domain/ports/workspace.repository';
import { InMemoryWorkspaceRepository } from '@workspaces/infrastructure/in-memory-workspace.repository';
import { PostgresWorkspaceRepository } from '@workspaces/infrastructure/postgres-workspace.repository';
import { createRepositoryProvider } from '@shared/infrastructure/database/persistence.provider';

@Module({
  providers: [
    createRepositoryProvider(
      WORKSPACE_REPOSITORY,
      PostgresWorkspaceRepository,
      InMemoryWorkspaceRepository,
    ),
  ],
  exports: [WORKSPACE_REPOSITORY],
})
export class WorkspacesModule {}
