import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { beforeAll, afterAll, describe, expect, it } from '@jest/globals';
import { PostgresAccountDeletionRepository } from '@user-settings/infrastructure/postgres-account-deletion.repository';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import * as schema from '@shared/infrastructure/database/schema';
import { eq } from 'drizzle-orm';

const runIntegration = process.env.RUN_POSTGRES_INTEGRATION === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;
const { inviteCodes, permissions, users, vaults, workspaces } = schema;

describeIntegration('Postgres account deletion', () => {
  let pool: Pool;
  let database: DrizzleDatabase;

  beforeAll(() => {
    pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      database: process.env.DB_NAME ?? 'budget',
      user: process.env.DB_USER ?? 'budget_app',
      password: process.env.DB_PASSWORD ?? '',
    });
    database = drizzle(pool, { schema });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('deletes the user-owned graph atomically', async () => {
    const userId = randomUUID();
    const workspaceId = randomUUID();
    const inviteCodeId = randomUUID();
    const now = new Date();
    let deleted = false;

    try {
      await database.insert(workspaces).values({
        id: workspaceId,
        name: 'Deletion test workspace',
        createdAt: now,
      });
      await database.insert(users).values({
        id: userId,
        email: `${userId}@example.test`,
        passwordHash: 'hash',
        role: 'Member',
        workspaceId,
        createdAt: now,
        preferences: {
          currency: 'PLN',
          dateFormat: 'DD.MM.YYYY',
          language: 'pl',
          theme: 'dark',
          homePage: 'dashboard',
        },
        tokenVersion: 0,
      });
      await database.insert(vaults).values({
        id: randomUUID(),
        workspaceId,
        encryptedBlob: 'opaque-deletion-test-blob',
        contentHash: 'deletion-vault-hash',
        byteSize: 27,
        revision: 1,
        createdAt: now,
        updatedAt: now,
      });
      await database.insert(permissions).values({
        id: randomUUID(),
        userId,
        resourceType: 'workspace',
        resourceId: workspaceId,
        actions: ['read', 'write'],
        createdAt: now,
      });
      await database.insert(inviteCodes).values({
        id: inviteCodeId,
        code: `DEL${userId.slice(0, 5)}`,
        createdBy: userId,
        status: 'Used',
        createdAt: now,
        expiresAt: null,
        usedBy: userId,
        usedAt: now,
      });

      const repository = new PostgresAccountDeletionRepository(database);
      await repository.deleteUserOwnedData(userId, workspaceId);
      deleted = true;

      expect(
        await database.select().from(users).where(eq(users.id, userId)),
      ).toHaveLength(0);
      expect(
        await database
          .select()
          .from(workspaces)
          .where(eq(workspaces.id, workspaceId)),
      ).toHaveLength(0);
      expect(
        await database
          .select()
          .from(inviteCodes)
          .where(eq(inviteCodes.id, inviteCodeId)),
      ).toHaveLength(0);
      expect(
        await database
          .select()
          .from(vaults)
          .where(eq(vaults.workspaceId, workspaceId)),
      ).toHaveLength(0);
      expect(
        await database
          .select()
          .from(permissions)
          .where(eq(permissions.userId, userId)),
      ).toHaveLength(0);
    } finally {
      if (!deleted) {
        try {
          await database
            .delete(inviteCodes)
            .where(eq(inviteCodes.id, inviteCodeId));
          await database
            .delete(permissions)
            .where(eq(permissions.userId, userId));
          await database
            .delete(vaults)
            .where(eq(vaults.workspaceId, workspaceId));
          await database.delete(users).where(eq(users.id, userId));
          await database
            .delete(workspaces)
            .where(eq(workspaces.id, workspaceId));
        } catch {
          // Preserve the original integration failure when the database is unavailable.
        }
      }
    }
  });
});
