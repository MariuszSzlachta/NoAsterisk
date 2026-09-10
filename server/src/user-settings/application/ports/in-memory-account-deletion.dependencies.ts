export interface InMemoryAccountDeletionDependencies {
  readonly findWorkspaceUsers: () => Promise<
    ReadonlyArray<{ readonly id: string; readonly workspaceId: string }>
  >;
  readonly deleteUser: (userId: string) => Promise<void>;
  readonly deletePermissions: (userId: string) => Promise<void>;
  readonly deleteInviteReferences: (userId: string) => Promise<void>;
  readonly deleteVault: (workspaceId: string) => Promise<void>;
  readonly deleteWorkspace: (workspaceId: string) => Promise<void>;
}
