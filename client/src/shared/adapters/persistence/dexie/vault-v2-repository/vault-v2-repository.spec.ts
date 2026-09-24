import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import { VaultV2Database } from '#shared/adapters/persistence/dexie/vault-v2-database';
import {
  createVaultV2Repository,
  rotateVaultRecords,
} from '#shared/adapters/persistence/dexie/vault-v2-repository';
import { createDatabaseLock } from '#shared/adapters/persistence/session/database-lock';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

const context = {
  accountId: 'account',
  workspaceId: 'workspace',
  vaultId: 'vault',
  keyId: 'key',
  deviceId: 'device',
};

const databases: VaultV2Database[] = [];
const runExclusive = createDatabaseLock();

afterEach(async () => {
  await Promise.all(
    databases.splice(0).map(async (database) => database.delete()),
  );
});

describe('VaultV2Repository', () => {
  it('stores protocol envelopes and roundtrips validated records', async () => {
    const database = new VaultV2Database(
      context.accountId,
      context.workspaceId,
      context.vaultId,
    );
    databases.push(database);
    await database.open();
    const keys = await vaultProtocol.deriveKeys(new Uint8Array(32), context);
    const repository = createVaultV2Repository(
      database,
      'transactions',
      () => keys.local,
      (value): value is { id: string; amount: number } =>
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        typeof value.id === 'string' &&
        'amount' in value &&
        typeof value.amount === 'number',
      (record) => record.id,
      context,
      runExclusive,
      () => true,
    );
    await repository.put({ id: 'record', amount: 12 });
    const raw = await database.records.get(['transactions', 'record']);
    expect(raw?.ciphertext).not.toBe(
      JSON.stringify({ id: 'record', amount: 12 }),
    );
    await expect(repository.get('record')).resolves.toEqual({
      id: 'record',
      amount: 12,
    });
  });

  it('rejects a record when the account context changes', async () => {
    const database = new VaultV2Database(
      context.accountId,
      context.workspaceId,
      context.vaultId,
    );
    databases.push(database);
    await database.open();
    const keys = await vaultProtocol.deriveKeys(new Uint8Array(32), context);
    const validator = (value: unknown): value is { id: string } =>
      typeof value === 'object' && value !== null && 'id' in value;
    const originalRepository = createVaultV2Repository(
      database,
      'transactions',
      () => keys.local,
      validator,
      (record) => record.id,
      context,
      runExclusive,
      () => true,
    );
    await originalRepository.put({ id: 'record' });
    const repository = createVaultV2Repository(
      database,
      'transactions',
      () => keys.local,
      validator,
      (record) => record.id,
      { ...context, accountId: 'other-account' },
      runExclusive,
      () => true,
    );
    await expect(repository.get('record')).rejects.toThrow();
  });

  it('serializes concurrent putManyIfAbsent operations', async () => {
    const database = new VaultV2Database(
      context.accountId,
      context.workspaceId,
      context.vaultId,
    );
    databases.push(database);
    await database.open();
    const keys = await vaultProtocol.deriveKeys(new Uint8Array(32), context);
    const repository = createVaultV2Repository(
      database,
      'transactions',
      () => keys.local,
      (value): value is { id: string } =>
        typeof value === 'object' && value !== null && 'id' in value,
      (record) => record.id,
      context,
      runExclusive,
      () => true,
    );
    const [first, second] = await Promise.all([
      repository.putManyIfAbsent([{ id: 'same' }], (record) => record.id),
      repository.putManyIfAbsent([{ id: 'same' }], (record) => record.id),
    ]);
    expect(first.written.length + second.written.length).toBe(1);
  });

  it('refuses writes after the persistence generation has been invalidated', async () => {
    const database = new VaultV2Database(
      context.accountId,
      context.workspaceId,
      context.vaultId,
    );
    databases.push(database);
    await database.open();
    const keys = await vaultProtocol.deriveKeys(new Uint8Array(32), context);
    let active = true;
    const repository = createVaultV2Repository(
      database,
      'transactions',
      () => keys.local,
      (value): value is { id: string } =>
        typeof value === 'object' && value !== null && 'id' in value,
      (record) => record.id,
      context,
      runExclusive,
      () => active,
    );

    active = false;
    await expect(repository.put({ id: 'locked-record' })).rejects.toThrow(
      'persistence session is locked',
    );
    await expect(database.records.toArray()).resolves.toEqual([]);
  });

  it('re-encrypts all records and metadata atomically under a new key context', async () => {
    const database = new VaultV2Database(
      context.accountId,
      context.workspaceId,
      context.vaultId,
    );
    databases.push(database);
    await database.open();
    const oldVmk = new Uint8Array(32).fill(1);
    const newVmk = new Uint8Array(32).fill(2);
    const oldKeys = await vaultProtocol.deriveKeys(oldVmk, context);
    const nextContext = { ...context, keyId: 'key-rotated' };
    const nextKeys = await vaultProtocol.deriveKeys(newVmk, nextContext);
    const signingKeyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign', 'verify'],
    );
    const localShare = await vaultProtocol.generateLocalShare();
    const record = await vaultProtocol.encryptRecord(
      JSON.stringify({ id: 'record', amount: 12 }),
      {
        accountId: context.accountId,
        workspaceId: context.workspaceId,
        vaultId: context.vaultId,
        keyId: context.keyId,
        collection: 'transactions',
        recordId: 'record',
      },
      oldKeys.local,
    );
    await database.records.put({
      id: 'record',
      collection: 'transactions',
      header: record.header,
      ciphertext: record.ciphertext,
      updatedAt: Date.now(),
    });
    await database.metadata.put({
      id: 'vault',
      protocolVersion: 2,
      accountId: context.accountId,
      workspaceId: context.workspaceId,
      vaultId: context.vaultId,
      keyId: context.keyId,
      deviceId: context.deviceId,
      createdAt: Date.now(),
      localShare,
      signingKeyPair,
      sentinel: await vaultProtocol.createSentinel(
        {
          accountId: context.accountId,
          workspaceId: context.workspaceId,
          vaultId: context.vaultId,
          keyId: context.keyId,
        },
        oldKeys.check,
      ),
    });

    await rotateVaultRecords.rotate({
      database,
      currentKey: oldKeys.local,
      nextKey: nextKeys.local,
      nextCheckKey: nextKeys.check,
      currentContext: context,
      nextContext,
      nextLocalShare: null,
      isSessionActive: () => true,
    });

    const rotated = await database.records.get(['transactions', 'record']);
    expect(rotated?.header.keyId).toBe('key-rotated');
    await expect(
      vaultProtocol.decryptRecord(
        {
          header: rotated?.header ?? {},
          ciphertext: rotated?.ciphertext ?? '',
        },
        {
          accountId: nextContext.accountId,
          workspaceId: nextContext.workspaceId,
          vaultId: nextContext.vaultId,
          keyId: nextContext.keyId,
          collection: 'transactions',
          recordId: 'record',
        },
        nextKeys.local,
      ),
    ).resolves.toBe(JSON.stringify({ id: 'record', amount: 12 }));
    const metadata = await database.metadata.get('vault');
    expect(metadata?.keyId).toBe('key-rotated');
    expect(metadata?.localShare).toBeUndefined();
    await expect(
      vaultProtocol.verifySentinel(
        metadata?.sentinel,
        {
          accountId: context.accountId,
          workspaceId: context.workspaceId,
          vaultId: context.vaultId,
          keyId: 'key-rotated',
        },
        nextKeys.check,
      ),
    ).resolves.toBeUndefined();
  });

  it('does not mutate records when old-key authentication fails', async () => {
    const database = new VaultV2Database(
      context.accountId,
      context.workspaceId,
      `${context.vaultId}-failure`,
    );
    databases.push(database);
    await database.open();
    const oldKeys = await vaultProtocol.deriveKeys(new Uint8Array(32).fill(3), {
      ...context,
      vaultId: `${context.vaultId}-failure`,
    });
    const nextKeys = await vaultProtocol.deriveKeys(
      new Uint8Array(32).fill(4),
      {
        ...context,
        vaultId: `${context.vaultId}-failure`,
        keyId: 'key-rotated',
      },
    );
    const record = await vaultProtocol.encryptRecord(
      JSON.stringify({ id: 'record' }),
      {
        accountId: context.accountId,
        workspaceId: context.workspaceId,
        vaultId: `${context.vaultId}-failure`,
        keyId: context.keyId,
        collection: 'transactions',
        recordId: 'record',
      },
      oldKeys.local,
    );
    await database.records.put({
      id: 'record',
      collection: 'transactions',
      header: record.header,
      ciphertext: record.ciphertext,
      updatedAt: Date.now(),
    });
    const before = await database.records.get(['transactions', 'record']);
    await expect(
      rotateVaultRecords.rotate({
        database,
        currentKey: nextKeys.local,
        nextKey: oldKeys.local,
        nextCheckKey: nextKeys.check,
        currentContext: { ...context, vaultId: `${context.vaultId}-failure` },
        nextContext: {
          ...context,
          vaultId: `${context.vaultId}-failure`,
          keyId: 'key-rotated',
        },
        nextLocalShare: null,
        isSessionActive: () => true,
      }),
    ).rejects.toThrow();
    await expect(
      database.records.get(['transactions', 'record']),
    ).resolves.toEqual(before);
  });

  it('persists only encrypted VMK recovery material until server commit', async () => {
    const database = new VaultV2Database(
      context.accountId,
      context.workspaceId,
      `${context.vaultId}-journal`,
    );
    databases.push(database);
    await database.open();
    const oldVmk = new Uint8Array(32).fill(5);
    const nextVmk = new Uint8Array(32).fill(6);
    const journalContext = {
      ...context,
      vaultId: `${context.vaultId}-journal`,
    };
    const oldKeys = await vaultProtocol.deriveKeys(oldVmk, journalContext);
    const nextContext = { ...journalContext, keyId: 'key-journal-next' };
    const nextKeys = await vaultProtocol.deriveKeys(nextVmk, nextContext);
    await database.metadata.put({
      id: 'vault',
      protocolVersion: 2,
      accountId: journalContext.accountId,
      workspaceId: journalContext.workspaceId,
      vaultId: journalContext.vaultId,
      keyId: journalContext.keyId,
      deviceId: journalContext.deviceId,
      createdAt: Date.now(),
      signingKeyPair: await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign', 'verify'],
      ),
      sentinel: await vaultProtocol.createSentinel(
        {
          accountId: journalContext.accountId,
          workspaceId: journalContext.workspaceId,
          vaultId: journalContext.vaultId,
          keyId: journalContext.keyId,
        },
        oldKeys.check,
      ),
    });

    await rotateVaultRecords.rotate({
      database,
      currentKey: oldKeys.local,
      nextKey: nextKeys.local,
      nextCheckKey: nextKeys.check,
      currentContext: journalContext,
      nextContext,
      nextLocalShare: null,
      pendingRotation: {
        idempotencyKey: 'journal-1',
        recoveryBackupConfirmed: true,
        envelopePurpose: 'device-wrap',
        envelope: 'opaque-next-envelope',
        nextVmk,
        transcript: {
          accountId: journalContext.accountId,
          workspaceId: journalContext.workspaceId,
          vaultId: journalContext.vaultId,
          deviceId: journalContext.deviceId,
          currentKeyId: journalContext.keyId,
          nextKeyId: nextContext.keyId,
          challenge: 'a'.repeat(43),
          expiresAt: new Date(Date.now() + 30_000).toISOString(),
          currentRecoveryPublicKey: 'a'.repeat(64),
          nextRecoveryPublicKey: 'b'.repeat(64),
          signingPublicKey: '{"kty":"EC"}',
          envelopePurpose: 'device-wrap',
          envelope: 'opaque-next-envelope',
        },
      },
      isSessionActive: () => true,
    });

    const metadata = await database.metadata.get('vault');
    expect(metadata?.pendingRotation?.nextKeyId).toBe('key-journal-next');
    expect(metadata?.pendingRotation?.transcript?.challenge).toBe(
      'a'.repeat(43),
    );
    expect(
      metadata?.pendingRotation?.currentVmkEnvelope.ciphertext,
    ).not.toContain(String.fromCharCode(...nextVmk));
    expect(metadata?.pendingRotation?.nextVmkEnvelope.ciphertext).not.toContain(
      String.fromCharCode(...nextVmk),
    );
  });
});
