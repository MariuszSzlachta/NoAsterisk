export const ENCRYPTED_DATABASE_NAME = 'budgetflow-encrypted-financial-data';

export const getAccountDatabaseName = (
  userId: string,
  workspaceId: string,
): string => `${ENCRYPTED_DATABASE_NAME}:${userId}:${workspaceId}`;
