import 'fake-indexeddb/auto';

import { describe, expect, it, vi } from 'vitest';

import { renewVaultRotationJournal } from '#shared/adapters/persistence/dexie/renewVaultRotationJournal';
import { VaultV2Database } from '#shared/adapters/persistence/dexie/vault-v2-database';
import type { VaultV2Metadata } from '#shared/adapters/persistence/dexie/vault-v2-database/types';
import { buildRotationFixture } from '#shared/adapters/vault-protocol/dual-root-vault-rotation/testing/buildRotationFixture';

describe('renewVaultRotationJournal', () => {
  it('should persist the renewed transcript while preserving encrypted root material across reopen', async () => {
    const f = await buildRotationFixture();
    const database = new VaultV2Database(
      f.material.context.accountId,
      f.material.context.workspaceId,
      f.material.context.vaultId,
    );
    const metadata: VaultV2Metadata = {
      id: 'vault',
      protocolVersion: 2,
      ...f.nextMaterial.context,
      createdAt: 1,
      signingKeyPair: {
        privateKey: f.material.signingKey,
        publicKey: f.material.verifyKey,
      },
      sentinel: { header: {}, ciphertext: 'synthetic-sentinel' },
      pendingRotation: f.pending,
    };
    try {
      await database.metadata.put(metadata);
      const renewed = {
        ...f.transcript,
        challenge: 'B'.repeat(43),
        expiresAt: new Date(Date.now() + 30_000).toISOString(),
      };
      await renewVaultRotationJournal(
        database,
        f.transcript.challenge,
        renewed,
        vi.fn(),
      );
      database.close();
      await database.open();
      const saved = await database.metadata.get('vault');
      expect(saved?.pendingRotation).toEqual({
        ...f.pending,
        idempotencyKey: renewed.challenge,
        transcript: renewed,
      });
    } finally {
      await database.delete();
    }
  });
  it.each(['nextRecoveryPublicKey', 'envelope', 'workspaceId', 'currentKeyId'])(
    'should reject substituted %s and retain the original journal',
    async (field) => {
      const f = await buildRotationFixture();
      const database = new VaultV2Database(
        f.material.context.accountId,
        f.material.context.workspaceId,
        f.material.context.vaultId,
      );
      const metadata: VaultV2Metadata = {
        id: 'vault',
        protocolVersion: 2,
        ...f.nextMaterial.context,
        createdAt: 1,
        signingKeyPair: {
          privateKey: f.material.signingKey,
          publicKey: f.material.verifyKey,
        },
        sentinel: { header: {}, ciphertext: 'synthetic-sentinel' },
        pendingRotation: f.pending,
      };
      try {
        await database.metadata.put(metadata);
        const renewed = {
          ...f.transcript,
          challenge: 'B'.repeat(43),
          expiresAt: new Date(Date.now() + 30_000).toISOString(),
          [field]:
            field === 'nextRecoveryPublicKey' ? 'c'.repeat(64) : 'substituted',
        };
        await expect(
          renewVaultRotationJournal(
            database,
            f.transcript.challenge,
            renewed,
            vi.fn(),
          ),
        ).rejects.toThrow();
        expect((await database.metadata.get('vault'))?.pendingRotation).toEqual(
          f.pending,
        );
      } finally {
        await database.delete();
      }
    },
  );
  it('should accept only one concurrent renewal of the previous challenge', async () => {
    const f = await buildRotationFixture();
    const database = new VaultV2Database(
      f.material.context.accountId,
      f.material.context.workspaceId,
      f.material.context.vaultId,
    );
    const metadata: VaultV2Metadata = {
      id: 'vault',
      protocolVersion: 2,
      ...f.nextMaterial.context,
      createdAt: 1,
      signingKeyPair: {
        privateKey: f.material.signingKey,
        publicKey: f.material.verifyKey,
      },
      sentinel: { header: {}, ciphertext: 'synthetic-sentinel' },
      pendingRotation: f.pending,
    };
    try {
      await database.metadata.put(metadata);
      const renewed = {
        ...f.transcript,
        challenge: 'B'.repeat(43),
        expiresAt: new Date(Date.now() + 30_000).toISOString(),
      };
      const outcomes = await Promise.allSettled([
        renewVaultRotationJournal(
          database,
          f.transcript.challenge,
          renewed,
          vi.fn(),
        ),
        renewVaultRotationJournal(
          database,
          f.transcript.challenge,
          { ...renewed, challenge: 'C'.repeat(43) },
          vi.fn(),
        ),
      ]);
      expect(
        outcomes.filter((outcome) => outcome.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(
        outcomes.filter((outcome) => outcome.status === 'rejected'),
      ).toHaveLength(1);
    } finally {
      await database.delete();
    }
  });
});
