export interface AccountDeletionRepository {
  deleteUserOwnedData(userId: string, workspaceId: string): Promise<void>;
}
