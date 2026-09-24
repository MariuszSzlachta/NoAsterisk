import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { eq } from 'drizzle-orm';

import { Vault } from '@user-settings/domain/vault.entity';
import { PostgresVaultRepository } from '@user-settings/infrastructure/postgres-vault.repository';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import * as schema from '@shared/infrastructure/database/schema';
import { createPostgresTestConnection } from '@shared/testing/postgres-test-connection/create-postgres-test-connection';

const { workspaces, vaults } = schema;

const buildVault = (
  workspaceId: string,
  encryptedBlob: string,
  revision = 1,
): Vault =>
  new Vault(
    randomUUID(),
    workspaceId,
    encryptedBlob,
    `hash-${encryptedBlob}`,
    Buffer.byteLength(encryptedBlob, 'utf8'),
    revision,
    new Date('2026-09-10T00:00:00.000Z'),
    new Date('2026-09-10T00:00:00.000Z'),
  );

describe('PostgresVaultRepository integration', () => {
  let pool: Pool | undefined;
  let database: DrizzleDatabase;
  let repository: PostgresVaultRepository;
  const workspaceId = randomUUID();

  beforeAll(async () => {
    const connection = await createPostgresTestConnection();
    pool = connection.pool;
    database = connection.database;
    repository = new PostgresVaultRepository(database);
    await database.insert(workspaces).values({
      id: workspaceId,
      name: 'Session 07 CAS test workspace',
      createdAt: new Date('2026-09-10T00:00:00.000Z'),
    });
  });

  afterAll(async () => {
    await database.delete(vaults).where(eq(vaults.workspaceId, workspaceId));
    await database.delete(workspaces).where(eq(workspaces.id, workspaceId));
    await pool?.end();
  });

  it('allows only one concurrent writer for the same base revision', async () => {
    const original = buildVault(workspaceId, 'ciphertext-original');
    await expect(
      repository.saveIfRevisionMatches(original, 0),
    ).resolves.toMatchObject({
      status: 'saved',
    });

    const candidateA = buildVault(workspaceId, 'ciphertext-a', 2);
    const candidateB = buildVault(workspaceId, 'ciphertext-b', 2);
    const results = await Promise.all([
      repository.saveIfRevisionMatches(candidateA, 1),
      repository.saveIfRevisionMatches(candidateB, 1),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual([
      'conflict',
      'saved',
    ]);
    await expect(
      repository.findByWorkspaceId(workspaceId),
    ).resolves.toMatchObject({
      revision: 2,
      encryptedBlob: expect.stringMatching(/^ciphertext-[ab]$/),
    });
  });

  it('returns the same snapshot for an identical retry without advancing revision', async () => {
    const current = await repository.findByWorkspaceId(workspaceId);
    if (!current) throw new Error('Expected the CAS fixture to exist');

    const retry = await repository.saveIfRevisionMatches(current, 1);

    expect(retry).toEqual({ status: 'saved', vault: current });
  });

  it('keeps a workspace read isolated from another workspace', async () => {
    const otherWorkspaceId = randomUUID();
    await database.insert(workspaces).values({
      id: otherWorkspaceId,
      name: 'Session 07 isolation workspace',
      createdAt: new Date('2026-09-10T00:00:00.000Z'),
    });

    try {
      await repository.saveIfRevisionMatches(
        buildVault(otherWorkspaceId, 'ciphertext-other-workspace'),
        0,
      );
      await expect(
        repository.findByWorkspaceId(otherWorkspaceId),
      ).resolves.toMatchObject({
        workspaceId: otherWorkspaceId,
        encryptedBlob: 'ciphertext-other-workspace',
      });
      await expect(
        repository.findByWorkspaceId(workspaceId),
      ).resolves.toMatchObject({ workspaceId });
    } finally {
      await database
        .delete(vaults)
        .where(eq(vaults.workspaceId, otherWorkspaceId));
      await database
        .delete(workspaces)
        .where(eq(workspaces.id, otherWorkspaceId));
    }
  });
});
