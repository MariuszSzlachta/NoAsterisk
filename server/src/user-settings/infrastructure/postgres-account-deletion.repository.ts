import { Injectable, Inject } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import {
  inviteCodes,
  permissions,
  users,
  vaults,
  workspaces,
} from '@shared/infrastructure/database/schema';
import { AccountDeletionRepository } from '@user-settings/application/ports/account-deletion.repository';

@Injectable()
export class PostgresAccountDeletionRepository implements AccountDeletionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async deleteUserOwnedData(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    await this.db.transaction(async (transaction) => {
      const workspaceUsers = await transaction
        .select({ id: users.id })
        .from(users)
        .where(eq(users.workspaceId, workspaceId));
      const isSoleWorkspaceUser =
        workspaceUsers.length === 1 && workspaceUsers[0]?.id === userId;

      await transaction
        .update(inviteCodes)
        .set({ usedBy: null, usedAt: null })
        .where(eq(inviteCodes.usedBy, userId));
      await transaction
        .delete(inviteCodes)
        .where(eq(inviteCodes.createdBy, userId));
      await transaction
        .delete(permissions)
        .where(eq(permissions.userId, userId));
      if (isSoleWorkspaceUser) {
        await transaction
          .delete(vaults)
          .where(eq(vaults.workspaceId, workspaceId));
      }
      await transaction
        .delete(users)
        .where(and(eq(users.id, userId), eq(users.workspaceId, workspaceId)));
      if (isSoleWorkspaceUser) {
        await transaction
          .delete(workspaces)
          .where(eq(workspaces.id, workspaceId));
      }
    });
  }
}
