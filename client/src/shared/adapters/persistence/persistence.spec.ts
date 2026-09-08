import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CRYPTO_VERSION,
  composeRecordAad,
  decryptRecord,
  derivePersistenceKey,
  encryptBytes,
  encryptRecord,
  IV_LENGTH,
  isEncryptedRecordEnvelope,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  SHA_256_HEX_LENGTH,
  isSha256Hex,
  verifySentinel,
} from '#shared/adapters/persistence/crypto';
import { BudgetDatabase } from '#shared/adapters/persistence/dexie';
import { isCategoryInfo as isCategoryEntityInfo } from '#entities/category/is-category-info';
import { isRuleRecord as isRuleEntityRecord } from '#features/admin-rules/model/is-rule-record';
import { isBudgetRecord as isBudgetEntityRecord } from '#features/budgets/model/is-budget-record';
import { isPeriodHistoryRecord as isPeriodHistoryEntityRecord } from '#features/budgets/model/is-period-history-record';
import { isStoredTransaction as isStoredEntityTransaction } from '#features/transactions/model/is-stored-transaction';
import {
  isBudgetRecord,
  isCategoryInfo,
  isImportProfileRecord,
  isPeriodHistoryRecord,
  isRuleRecord,
  isStoredTransaction as isLegacyStoredTransaction,
  migrateLegacyLocalStorage,
} from '#shared/adapters/persistence/migrations';
import { isLegacyBudgetPeriod } from '#shared/adapters/persistence/migrations/is-legacy-budget-period';
import { isLegacyRollover } from '#shared/adapters/persistence/migrations/is-legacy-rollover';
import { getLegacyRecordId } from '#shared/adapters/persistence/migrations/get-legacy-record-id';
import { LEGACY_SOURCES } from '#shared/adapters/persistence/migrations/legacy-sources';
import { readLegacySource } from '#shared/adapters/persistence/migrations/read-legacy-source';
import { verifyLegacySources } from '#shared/adapters/persistence/migrations/verify-legacy-sources';
import { createEncryptedPersistence, encryptedPersistence } from '#shared/adapters/persistence/session';
import { createDatabaseLock } from '#shared/adapters/persistence/session/database-lock';
import { isDatabaseMetadata } from '#shared/adapters/persistence/session/is-database-metadata';
import { createPersistenceChannel } from '#shared/adapters/persistence/session/persistence-channel';
import { clearPersistenceStorage } from '#shared/adapters/persistence/session/persistence-storage';
import { getPersistenceRecordId } from '#shared/adapters/persistence/session/record-with-id';
import { persistInBackground } from '#shared/adapters/persistence/persist-in-background';
import type { DatabaseMetadataRecord, PersistenceCollection } from '#shared/adapters/persistence/ports';
import type { StoredTransaction } from '#features/transactions/model/types';
import { persistenceTestData } from '#shared/adapters/persistence/persistence-test-data';

class TestBroadcastChannel {
  static readonly instances: TestBroadcastChannel[] = [];
  readonly listeners = new Set<(event: MessageEvent<unknown>) => void>();

  public constructor(readonly name: string) {
    TestBroadcastChannel.instances.push(this);
  }

  public addEventListener(
    _type: string,
    listener: (event: MessageEvent<unknown>) => void,
  ): void {
    this.listeners.add(listener);
  }

  public postMessage(data: unknown): void {
    TestBroadcastChannel.instances
      .filter((instance) => instance.name === this.name && instance !== this)
      .forEach((instance) => {
        instance.listeners.forEach((listener) => listener(new MessageEvent('message', { data })));
      });
  }

  public close(): void {
    this.listeners.clear();
  }
}

const originalBroadcastChannel = globalThis.BroadcastChannel;

const installBroadcastChannel = (): void => {
  Object.defineProperty(globalThis, 'BroadcastChannel', {
    configurable: true,
    value: TestBroadcastChannel,
  });
};

const restoreBroadcastChannel = (): void => {
  if (originalBroadcastChannel === undefined) {
    Reflect.deleteProperty(globalThis, 'BroadcastChannel');
    return;
  }
  Object.defineProperty(globalThis, 'BroadcastChannel', {
    configurable: true,
    value: originalBroadcastChannel,
  });
};

const makeDatabase = (): BudgetDatabase =>
  new BudgetDatabase(`budgetflow-test-${crypto.randomUUID()}`);

const transaction: StoredTransaction = persistenceTestData.createTransaction();

describe('encrypted IndexedDB foundation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    TestBroadcastChannel.instances.splice(0);
    restoreBroadcastChannel();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('uses the documented PBKDF2, AES and nonce parameters', async () => {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const key = await derivePersistenceKey('correct horse battery staple', salt.buffer);

    expect(PBKDF2_ITERATIONS).toBe(600_000);
    expect(key.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    expect(key.extractable).toBe(false);

    const envelope = await encryptRecord('transactions', transaction.id, transaction, key);
    expect(envelope.cryptoVersion).toBe(CRYPTO_VERSION);
    expect(envelope.iv.byteLength).toBe(IV_LENGTH);
  });

  it('accepts the canonical SHA-256 digest representation', () => {
    expect(isSha256Hex('a'.repeat(SHA_256_HEX_LENGTH))).toBe(true);
  });

  it('roundtrips records and rejects tampering or AAD substitution', async () => {
    const database = makeDatabase();
    const persistence = createEncryptedPersistence(database);
    await persistence.unlock('vault-passphrase');
    const repository = persistence.repository('transactions', isStoredEntityTransaction, (record) => record.id);

    await repository.put(transaction);
    const stored = await database.records.get(['transactions', transaction.id]);
    if (!stored) {
      throw new Error('Expected encrypted record');
    }

    expect(stored).not.toHaveProperty('description');
    expect(stored).not.toHaveProperty('amount');
    expect(isEncryptedRecordEnvelope(null, 'transactions')).toBe(false);
    expect(isEncryptedRecordEnvelope(stored, 'rules')).toBe(false);
    expect(await repository.get(transaction.id)).toEqual(transaction);

    await expect(
      decryptRecord({ ...stored, id: 'different-id' }, 'transactions', persistence.requireKey(), isStoredEntityTransaction),
    ).rejects.toThrow('authentication failed');
    await expect(
      decryptRecord({ ...stored, collection: 'rules' }, 'rules', persistence.requireKey(), isStoredEntityTransaction),
    ).rejects.toThrow('authentication failed');
    await expect(
      decryptRecord({ ...stored, iv: new ArrayBuffer(1) }, 'transactions', persistence.requireKey(), isStoredEntityTransaction),
    ).rejects.toThrow('Invalid encrypted record envelope');

    const invalidJsonIv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const invalidJsonEnvelope = {
      ...stored,
      id: 'invalid-json',
      iv: invalidJsonIv.buffer,
      ciphertext: await encryptBytes(
        persistence.requireKey(),
        new TextEncoder().encode('not-json'),
        invalidJsonIv,
        new Uint8Array(composeRecordAad('transactions', 'invalid-json')),
      ),
    };
    await expect(
      decryptRecord(invalidJsonEnvelope, 'transactions', persistence.requireKey(), isStoredEntityTransaction),
    ).rejects.toThrow('not valid JSON');

    const invalidRecordIv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const invalidRecordEnvelope = {
      ...stored,
      id: 'invalid-record',
      iv: invalidRecordIv.buffer,
      ciphertext: await encryptBytes(
        persistence.requireKey(),
        new TextEncoder().encode('{}'),
        invalidRecordIv,
        new Uint8Array(composeRecordAad('transactions', 'invalid-record')),
      ),
    };
    await expect(
      decryptRecord(invalidRecordEnvelope, 'transactions', persistence.requireKey(), isStoredEntityTransaction),
    ).rejects.toThrow('failed validation');

    const tampered = new Uint8Array(stored.ciphertext.slice(0));
    tampered[0] = (tampered[0] ?? 0) ^ 1;
    await database.records.put({ ...stored, ciphertext: tampered.buffer });
    await expect(repository.get(transaction.id)).rejects.toThrow('authentication failed');
  });

  it('generates a fresh IV when the same record is written again', async () => {
    const database = makeDatabase();
    const persistence = createEncryptedPersistence(database);
    await persistence.unlock('vault-passphrase');
    const repository = persistence.repository('transactions', isStoredEntityTransaction, (record) => record.id);

    await repository.put(transaction);
    const first = await database.records.get(['transactions', transaction.id]);
    await repository.put(transaction);
    const second = await database.records.get(['transactions', transaction.id]);

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(new Uint8Array(first?.iv ?? new ArrayBuffer(0))).not.toEqual(
      new Uint8Array(second?.iv ?? new ArrayBuffer(0)),
    );
  });

  it('supports CRUD through every encrypted financial collection', async () => {
    const database = makeDatabase();
    const persistence = createEncryptedPersistence(database);
    await persistence.unlock('vault-passphrase');

    const roundtrip = async <TRecord extends { readonly id: string }>(
      collection: Exclude<PersistenceCollection, 'sentinel'>,
      first: TRecord,
      updated: TRecord,
      validator: (value: unknown) => value is TRecord,
    ): Promise<void> => {
      const repository = persistence.repository(collection, validator, (record) => record.id);
      await repository.put(first);
      expect(await repository.get(first.id)).toEqual(first);

      await repository.put(updated);
      expect(await repository.get(first.id)).toEqual(updated);

      await repository.delete(first.id);
      expect(await repository.get(first.id)).toBeUndefined();
    };

    await roundtrip(
      'rules',
      persistenceTestData.createRule(),
      persistenceTestData.createRule({ keyword: 'BIEDRONKA', matcherType: 'Exact', categoryId: 'cat-2', priority: 2 }),
      isRuleEntityRecord,
    );
    await roundtrip(
      'categories',
      persistenceTestData.createCategory(),
      persistenceTestData.createCategory({ label: 'Groceries', color: '#000' }),
      isCategoryEntityInfo,
    );
    await roundtrip(
      'budgets',
      persistenceTestData.createBudget(),
      persistenceTestData.createBudget({ name: 'Food updated', color: '#000', limitAmount: 1200 }),
      isBudgetEntityRecord,
    );
    await roundtrip(
      'period-history',
      persistenceTestData.createHistory(),
      persistenceTestData.createHistory({ spentAmount: 500, remainingAmount: 500 }),
      isPeriodHistoryEntityRecord,
    );
    await roundtrip(
      'import-profiles',
      persistenceTestData.createImportProfile(),
      persistenceTestData.createImportProfile({ name: 'Bank CSV updated', columnMapping: { date: 'Transaction date' } }),
      isImportProfileRecord,
    );
  });

  it('covers every legacy record validator with valid and invalid records', () => {
    const validTransaction = persistenceTestData.createTransaction();
    const validRule = persistenceTestData.createRule();
    const validCategory = persistenceTestData.createCategory();
    const validBudget = persistenceTestData.createBudget();
    const validHistory = persistenceTestData.createHistory();
    const validProfile = persistenceTestData.createImportProfile();

    expect(isLegacyStoredTransaction(validTransaction)).toBe(true);
    expect(isLegacyStoredTransaction({ ...validTransaction, amount: Number.NaN })).toBe(false);
    expect(isRuleRecord(validRule)).toBe(true);
    expect(isRuleRecord({ ...validRule, matcherType: 'Unknown' })).toBe(false);
    expect(isCategoryInfo(validCategory)).toBe(true);
    expect(isCategoryInfo({ ...validCategory, color: 123 })).toBe(false);
    expect(isPeriodHistoryRecord(validHistory)).toBe(true);
    expect(isPeriodHistoryRecord({ ...validHistory, rollover: { amount: 1 } })).toBe(false);
    expect(isBudgetRecord(validBudget)).toBe(true);
    expect(isBudgetRecord(null)).toBe(false);
    expect(isBudgetRecord({ ...validBudget, budgetType: 'savings', period: null })).toBe(true);
    expect(isBudgetRecord({ ...validBudget, budgetType: 'savings', period: { type: 'monthly' } })).toBe(false);
    expect(isImportProfileRecord(validProfile)).toBe(true);
    expect(isImportProfileRecord({ ...validProfile, columnMapping: { date: 1 } })).toBe(false);
  });

  it('validates all supported legacy period and rollover shapes', () => {
    expect(isLegacyBudgetPeriod({ type: 'monthly' })).toBe(true);
    expect(isLegacyBudgetPeriod({ type: 'yearly' })).toBe(true);
    expect(isLegacyBudgetPeriod({ type: 'custom', dateFrom: '2026-01-01', dateTo: '2026-01-31' })).toBe(true);
    expect(isLegacyBudgetPeriod({ type: 'monthly', dateFrom: 'unexpected' })).toBe(false);
    expect(isLegacyBudgetPeriod({ type: 'custom', dateFrom: '2026-01-01' })).toBe(false);
    expect(isLegacyBudgetPeriod({ type: 'weekly' })).toBe(false);
    expect(isLegacyBudgetPeriod(null)).toBe(false);

    expect(isLegacyRollover(null)).toBe(true);
    expect(isLegacyRollover({ amount: 10, targetType: 'same_budget', targetBudgetId: 'budget-1' })).toBe(true);
    expect(isLegacyRollover({ amount: 10, targetType: 'savings_budget', targetBudgetId: 'budget-1' })).toBe(true);
    expect(isLegacyRollover({ amount: 10, targetType: 'unknown', targetBudgetId: 'budget-1' })).toBe(false);
    expect(isLegacyRollover({ amount: Number.POSITIVE_INFINITY, targetType: 'same_budget', targetBudgetId: 'budget-1' })).toBe(false);
    expect(isLegacyRollover('invalid')).toBe(false);
  });

  it('starts a new persistence instance locked and hydrates after unlock', async () => {
    const database = makeDatabase();
    const firstSession = createEncryptedPersistence(database);
    await firstSession.unlock('vault-passphrase');
    const firstRepository = firstSession.repository('transactions', isStoredEntityTransaction, (record) => record.id);
    await firstRepository.put(transaction);
    firstSession.lock();

    const reloadedSession = createEncryptedPersistence(new BudgetDatabase(database.name));
    expect(reloadedSession.isUnlocked()).toBe(false);
    await expect(reloadedSession.repository('transactions', isStoredEntityTransaction, (record) => record.id).getAll()).rejects.toThrow('locked');
    await reloadedSession.unlock('vault-passphrase');
    const repository = reloadedSession.repository('transactions', isStoredEntityTransaction, (record) => record.id);
    expect(await repository.getAll()).toEqual([transaction]);
    await expect(reloadedSession.unlock('wrong-passphrase')).rejects.toThrow();
  });

  it('fails closed when hydration fails after the key is derived', async () => {
    const persistence = createEncryptedPersistence(makeDatabase());

    await expect(
      persistence.unlock('vault-passphrase', async () => {
        throw new Error('hydration failed');
      }),
    ).rejects.toThrow('hydration failed');

    expect(persistence.isUnlocked()).toBe(false);
    expect(persistence.getSnapshot()).toMatchObject({ status: 'error', error: 'hydration failed' });
    expect(() => persistence.requireKey()).toThrow('locked');
  });

  it('uses a safe fallback for non-Error unlock and write failures', async () => {
    const persistence = createEncryptedPersistence(makeDatabase());

    await expect(
      persistence.unlock('vault-passphrase', async () => {
        throw 'non-error unlock failure';
      }),
    ).rejects.toBe('non-error unlock failure');
    expect(persistence.getSnapshot()).toMatchObject({
      status: 'error',
      error: 'Unable to unlock local data',
    });

    await encryptedPersistence.unlock('vault-passphrase');
    persistInBackground(Promise.reject('non-error write failure'));
    await Promise.resolve();
    await Promise.resolve();
    expect(encryptedPersistence.getSnapshot()).toMatchObject({
      status: 'error',
      error: 'Encrypted persistence write failed',
    });
    encryptedPersistence.lock();

    persistInBackground(Promise.reject('ignored while locked'));
    await Promise.resolve();
    await Promise.resolve();
    expect(encryptedPersistence.getSnapshot().status).toBe('locked');

    persistence.failClosed('non-error write failure');
    expect(persistence.getSnapshot()).toMatchObject({
      status: 'error',
      error: 'Encrypted persistence write failed',
    });
  });

  it('rejects an empty vault passphrase before opening the database', async () => {
    const persistence = createEncryptedPersistence(makeDatabase());

    await expect(persistence.unlock('')).rejects.toThrow('cannot be empty');
    expect(persistence.getSnapshot().status).toBe('locked');
  });

  it('invalidates every other tab when one tab locks the vault', async () => {
    installBroadcastChannel();
    const databaseName = `budgetflow-multi-tab-${crypto.randomUUID()}`;
    const firstTab = createEncryptedPersistence(new BudgetDatabase(databaseName));
    const secondTab = createEncryptedPersistence(new BudgetDatabase(databaseName));

    await firstTab.unlock('vault-passphrase');
    await secondTab.unlock('vault-passphrase');
    expect(secondTab.isUnlocked()).toBe(true);

    const firstChannel = TestBroadcastChannel.instances[0];
    if (firstChannel === undefined) {
      throw new Error('Expected a test broadcast channel');
    }
    firstChannel.listeners.forEach((listener) => listener(new MessageEvent('message', { data: null })));
    firstChannel.listeners.forEach((listener) => listener(new MessageEvent('message', { data: { type: 'unknown' } })));
    expect(firstTab.isUnlocked()).toBe(true);

    firstTab.lock();

    expect(secondTab.isUnlocked()).toBe(false);
    expect(secondTab.getSnapshot().status).toBe('locked');
    expect(() => secondTab.requireKey()).toThrow('locked');
  });

  it('uses a no-op channel when BroadcastChannel is unavailable', () => {
    const originalChannel = Object.getOwnPropertyDescriptor(globalThis, 'BroadcastChannel');
    Object.defineProperty(globalThis, 'BroadcastChannel', {
      configurable: true,
      value: undefined,
    });

    const channel = createPersistenceChannel(vi.fn());
    expect(() => channel.broadcast('session-locked')).not.toThrow();

    if (originalChannel === undefined) {
      Reflect.deleteProperty(globalThis, 'BroadcastChannel');
      return;
    }
    Object.defineProperty(globalThis, 'BroadcastChannel', originalChannel);
  });

  it('notifies subscribers and fails closed explicitly', async () => {
    const persistence = createEncryptedPersistence(makeDatabase());
    const listener = vi.fn();
    const unsubscribe = persistence.subscribe(listener);

    await persistence.unlock('vault-passphrase');
    expect(listener).toHaveBeenCalled();
    const callsAfterUnlock = listener.mock.calls.length;

    persistence.failClosed(new Error('write failed'));
    expect(listener.mock.calls.length).toBeGreaterThan(callsAfterUnlock);
    expect(persistence.getSnapshot()).toMatchObject({ status: 'error', error: 'write failed' });

    unsubscribe();
    persistence.lock();
    expect(listener.mock.calls.length).toBeGreaterThan(callsAfterUnlock);
  });

  it('handles persistent storage capability and provider outcomes', async () => {
    const persistence = createEncryptedPersistence(makeDatabase());
    const originalStorage = Object.getOwnPropertyDescriptor(navigator, 'storage');

    Reflect.deleteProperty(navigator, 'storage');
    await expect(persistence.requestPersistentStorage()).resolves.toBe('unavailable');

    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { persist: vi.fn().mockResolvedValue(true) },
    });
    await expect(persistence.requestPersistentStorage()).resolves.toBe('granted');

    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { persist: vi.fn().mockResolvedValue(false) },
    });
    await expect(persistence.requestPersistentStorage()).resolves.toBe('denied');

    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { persist: vi.fn().mockRejectedValue(new Error('storage unavailable')) },
    });
    await expect(persistence.requestPersistentStorage()).resolves.toBe('unavailable');

    if (originalStorage === undefined) {
      Reflect.deleteProperty(navigator, 'storage');
      return;
    }
    Object.defineProperty(navigator, 'storage', originalStorage);
  });

  it('uses the Web Locks API when it is available', async () => {
    const originalLocks = Object.getOwnPropertyDescriptor(navigator, 'locks');
    const request = vi.fn(
      async (_name: string, _options: { readonly mode: 'exclusive' }, task: () => Promise<string>) => task(),
    );
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: { request },
    });

    const lock = createDatabaseLock();
    await expect(lock(async () => 'locked-result')).resolves.toBe('locked-result');
    expect(request).toHaveBeenCalledWith(
      'budgetflow-encrypted-database-initialization',
      { mode: 'exclusive' },
      expect.any(Function),
    );

    if (originalLocks === undefined) {
      Reflect.deleteProperty(navigator, 'locks');
      return;
    }
    Object.defineProperty(navigator, 'locks', originalLocks);
  });

  it('rejects malformed existing metadata instead of creating a new vault', async () => {
    expect(isDatabaseMetadata(null)).toBe(false);
    expect(
      isDatabaseMetadata({ salt: new ArrayBuffer(SALT_LENGTH), sentinel: null }),
    ).toBe(false);

    const database = makeDatabase();
    await database.open();
    await database.metadata.put({
      id: 'vault',
      salt: new ArrayBuffer(1),
      schemaVersion: 1,
      cryptoVersion: 1,
      sentinel: {
        id: 'verification',
        collection: 'sentinel',
        ciphertext: new ArrayBuffer(0),
        iv: new ArrayBuffer(IV_LENGTH),
        cryptoVersion: 1,
        updatedAt: Date.now(),
      },
      legacyMigration: 'pending',
      updatedAt: Date.now(),
    });

    await expect(createEncryptedPersistence(database).unlock('vault-passphrase')).rejects.toThrow(
      'Invalid encrypted database metadata',
    );
  });

  it('retains invalid legacy data and reports a migration warning', async () => {
    localStorage.setItem(
      'budget-transactions',
      JSON.stringify({ state: { transactions: [{ ...transaction, amount: 'not-a-number' }] }, version: 0 }),
    );
    const database = makeDatabase();
    const persistence = createEncryptedPersistence(database);
    await persistence.unlock('vault-passphrase');

    expect(persistence.getSnapshot().warning).toContain('retained');
    expect(localStorage.getItem('budget-transactions')).not.toBeNull();
    expect(await persistence.repository('transactions', isStoredEntityTransaction, (record) => record.id).getAll()).toEqual([]);
  });

  it('migrates valid legacy data and removes the key only after verification', async () => {
    localStorage.setItem(
      'budget-transactions',
      JSON.stringify({ state: { transactions: [transaction] }, version: 0 }),
    );
    const database = makeDatabase();
    const persistence = createEncryptedPersistence(database);
    await persistence.unlock('vault-passphrase');

    expect(localStorage.getItem('budget-transactions')).toBeNull();
    expect(await persistence.repository('transactions', isStoredEntityTransaction, (record) => record.id).get(transaction.id)).toEqual(transaction);
  });

  it('rolls back a failed Dexie transaction completely', async () => {
    const database = makeDatabase();
    await database.open();
    const key = await derivePersistenceKey(
      'vault-passphrase',
      crypto.getRandomValues(new Uint8Array(SALT_LENGTH)).buffer,
    );
    const envelope = await encryptRecord('transactions', transaction.id, transaction, key);

    await expect(
      database.transaction('rw', database.records, async () => {
        await database.records.put(envelope);
        throw new Error('forced failure');
      }),
    ).rejects.toThrow('forced failure');
    expect(await database.records.count()).toBe(0);
  });

  it('serializes migration writes through a single recoverable transaction', async () => {
    const database = makeDatabase();
    await database.open();
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH)).buffer;
    const key = await derivePersistenceKey('vault-passphrase', salt);
    const sentinel = await encryptRecord('sentinel', 'verification', { value: 'budgetflow-local-vault-verification-v1' }, key);
    const metadata: DatabaseMetadataRecord = {
      id: 'vault',
      salt,
      schemaVersion: 1,
      cryptoVersion: 1,
      sentinel,
      legacyMigration: 'pending',
      updatedAt: Date.now(),
    };
    await database.metadata.put(metadata);

    localStorage.setItem('budget-transactions', JSON.stringify({ state: { transactions: [] }, version: 0 }));
    const result = await migrateLegacyLocalStorage(database, key, metadata);

    expect(result.status).toBe('complete');
    expect(localStorage.getItem('budget-transactions')).toBeNull();
    expect(await database.records.where('collection').equals('transactions').count()).toBe(0);
  });

  it('keeps every legacy source when one source is invalid', async () => {
    localStorage.setItem(
      'budget-transactions',
      JSON.stringify({ state: { transactions: [transaction] }, version: 0 }),
    );
    localStorage.setItem(
      'budget-rules',
      JSON.stringify({ state: { rules: [{ id: 'invalid' }] }, version: 0 }),
    );

    const database = makeDatabase();
    const persistence = createEncryptedPersistence(database);
    await persistence.unlock('vault-passphrase');

    expect(persistence.getSnapshot().warning).toContain('retained');
    expect(localStorage.getItem('budget-transactions')).not.toBeNull();
    expect(localStorage.getItem('budget-rules')).not.toBeNull();
    expect(await database.records.where('collection').equals('transactions').count()).toBe(0);
    expect(await database.records.where('collection').equals('rules').count()).toBe(0);
  });

  it('classifies absent, malformed and unreadable legacy storage safely', () => {
    const [source] = LEGACY_SOURCES;
    if (source === undefined) {
      throw new Error('Expected legacy source');
    }

    expect(readLegacySource(source)).toBe('absent');

    localStorage.setItem(source.key, 'not-json');
    expect(readLegacySource(source)).toBe('invalid');

    localStorage.setItem(source.key, JSON.stringify({ state: {} }));
    expect(readLegacySource(source)).toBe('invalid');

    localStorage.setItem(source.key, JSON.stringify({}));
    expect(readLegacySource(source)).toBe('invalid');

    localStorage.setItem(source.key, JSON.stringify({ state: { [source.stateField]: [{ id: 'invalid' }] } }));
    expect(readLegacySource(source)).toBe('invalid');

    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage read failed');
    });
    expect(readLegacySource(source)).toBe('invalid');
    expect(getItem).toHaveBeenCalled();
  });

  it('rejects legacy records without identifiers before migration', () => {
    expect(getLegacyRecordId({ id: 'legacy-1' })).toBe('legacy-1');
    expect(() => getLegacyRecordId({})).toThrow('Legacy record is missing an id');
  });

  it('rejects a legacy record without an id before encryption', async () => {
    const persistence = createEncryptedPersistence(makeDatabase());
    await persistence.unlock('vault-passphrase');

    await expect(
      persistence.replaceCollections([{ collection: 'transactions', records: [{}] }]),
    ).rejects.toThrow('missing an id');
    expect(await persistence.repository('transactions', isStoredEntityTransaction, (record) => record.id).getAll()).toEqual([]);
    expect(getPersistenceRecordId({ id: 'record-1' })).toBe('record-1');
    expect(() => getPersistenceRecordId({})).toThrow('missing an id');
  });

  it('fails migration verification closed when IndexedDB loses a record', async () => {
    const [source] = LEGACY_SOURCES;
    if (source === undefined) {
      throw new Error('Expected legacy source');
    }
    const database = makeDatabase();
    await database.open();
    const key = await derivePersistenceKey(
      'vault-passphrase',
      crypto.getRandomValues(new Uint8Array(SALT_LENGTH)).buffer,
    );
    const envelope = await encryptRecord(source.collection, transaction.id, transaction, key);
    await database.records.put(envelope);

    await expect(
      verifyLegacySources(database, [{ source, envelopes: [] }], key),
    ).rejects.toThrow('verification failed');
  });

  it('can replace multiple collections atomically through the session boundary', async () => {
    const database = makeDatabase();
    const persistence = createEncryptedPersistence(database);
    const category = persistenceTestData.createCategory({ label: 'Private' });
    await persistence.unlock('vault-passphrase');

    await persistence.replaceCollections([
      { collection: 'transactions', records: [transaction] },
      { collection: 'categories', records: [category] },
    ]);

    expect(await database.records.where('collection').equals('transactions').count()).toBe(1);
    expect(await database.records.where('collection').equals('categories').count()).toBe(1);
    expect(
      await persistence
        .repository('transactions', isStoredEntityTransaction, (record) => record.id)
        .getAll(),
    ).toEqual([transaction]);
    expect(
      await persistence
        .repository('categories', isCategoryEntityInfo, (record) => record.id)
        .getAll(),
    ).toEqual([category]);
  });

  it('supports batch repository writes, replacement and clearing', async () => {
    const database = makeDatabase();
    const persistence = createEncryptedPersistence(database);
    await persistence.unlock('vault-passphrase');
    const repository = persistence.repository('transactions', isStoredEntityTransaction, (record) => record.id);
    const secondTransaction = persistenceTestData.createTransaction({ id: 'tx-2', amount: -12 });

    await repository.putMany([transaction, secondTransaction]);
    expect(await repository.getAll()).toEqual([transaction, secondTransaction]);

    await repository.replace([secondTransaction]);
    expect(await repository.getAll()).toEqual([secondTransaction]);

    await repository.clear();
    expect(await repository.getAll()).toEqual([]);
  });

  it('deduplicates existing and repeated content hashes atomically', async () => {
    const database = makeDatabase();
    const persistence = createEncryptedPersistence(database);
    await persistence.unlock('vault-passphrase');
    const repository = persistence.repository(
      'transactions',
      isStoredEntityTransaction,
      (record) => record.id,
    );
    const existing = persistenceTestData.createTransaction({
      id: 'existing-id',
      contentHash: 'same-hash',
    });
    const firstNew = persistenceTestData.createTransaction({
      id: 'new-id',
      contentHash: 'new-hash',
    });
    const repeatedNew = persistenceTestData.createTransaction({
      id: 'repeated-id',
      contentHash: 'new-hash',
    });

    await repository.put(existing);
    const result = await repository.putManyIfAbsent(
      [
        persistenceTestData.createTransaction({ id: 'duplicate-id', contentHash: 'same-hash' }),
        firstNew,
        repeatedNew,
      ],
      (record) => record.contentHash,
    );

    expect(result.written).toEqual([firstNew]);
    expect(result.duplicatesSkipped).toBe(2);
    expect(await repository.getAll()).toEqual([existing, firstNew]);
  });

  it('rejects invalid sentinels before accepting a vault session', async () => {
    const database = makeDatabase();
    const persistence = createEncryptedPersistence(database);
    await persistence.unlock('vault-passphrase');
    const metadata = await database.metadata.get('vault');

    if (metadata === undefined) {
      throw new Error('Expected persistence metadata');
    }

    await expect(
      verifySentinel({ ...metadata.sentinel, id: 'wrong-sentinel' }, persistence.requireKey()),
    ).rejects.toThrow('Vault verification failed');

    const wrongValue = await encryptRecord(
      'sentinel',
      'verification',
      { value: 'wrong-value' },
      persistence.requireKey(),
    );
    await expect(verifySentinel(wrongValue, persistence.requireKey())).rejects.toThrow(
      'Vault verification failed',
    );

    const invalidValue = await encryptRecord(
      'sentinel',
      'verification',
      [],
      persistence.requireKey(),
    );
    await expect(verifySentinel(invalidValue, persistence.requireKey())).rejects.toThrow(
      'failed validation',
    );
  });

  it('clears encrypted records and selected local storage keys', async () => {
    const database = makeDatabase();
    const persistence = createEncryptedPersistence(database);
    localStorage.setItem('budget-theme', 'dark');
    localStorage.setItem('budget-preferences', '{"currency":"PLN"}');
    await persistence.unlock('vault-passphrase');
    const repository = persistence.repository('transactions', isStoredEntityTransaction, (record) => record.id);
    await repository.put(transaction);

    await persistence.clearLocalData({ removePreferences: true });
    await database.open();

    expect(await database.records.count()).toBe(0);
    expect(localStorage.getItem('budget-transactions')).toBeNull();
    expect(localStorage.getItem('budget-theme')).toBeNull();
    expect(localStorage.getItem('budget-preferences')).toBeNull();
  });

  it('keeps preferences when clearing only encrypted financial data', async () => {
    const database = makeDatabase();
    const persistence = createEncryptedPersistence(database);
    localStorage.setItem('budget-theme', 'dark');
    localStorage.setItem('budget-preferences', '{"currency":"PLN"}');

    await persistence.unlock('vault-passphrase');
    await persistence.clearLocalData();

    expect(localStorage.getItem('budget-theme')).toBe('dark');
    expect(localStorage.getItem('budget-preferences')).toBe('{"currency":"PLN"}');
  });

  it('does nothing when local storage is unavailable', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Reflect.deleteProperty(globalThis, 'localStorage');

    expect(() => clearPersistenceStorage(true)).not.toThrow();

    if (descriptor === undefined) {
      return;
    }
    Object.defineProperty(globalThis, 'localStorage', descriptor);
  });
});
