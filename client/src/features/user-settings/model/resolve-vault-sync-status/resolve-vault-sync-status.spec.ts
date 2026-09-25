import { describe, expect, it } from 'vitest';

import { resolveVaultSyncStatus } from './resolve-vault-sync-status';

const baseInput = {
  hasConflict: false,
  hasRemoteError: false,
  isSyncing: false,
  isDirty: false,
  observedRevision: undefined,
  remoteRevision: undefined,
};

describe('resolveVaultSyncStatus', () => {
  it('prioritizes blocking and in-progress states', () => {
    expect(resolveVaultSyncStatus({ ...baseInput, hasConflict: true })).toBe(
      'conflict',
    );
    expect(resolveVaultSyncStatus({ ...baseInput, hasRemoteError: true })).toBe(
      'error',
    );
    expect(resolveVaultSyncStatus({ ...baseInput, isSyncing: true })).toBe(
      'syncing',
    );
  });

  it('distinguishes local, remote and synchronized revisions', () => {
    expect(resolveVaultSyncStatus(baseInput)).toBe('never-synced');
    expect(resolveVaultSyncStatus({ ...baseInput, isDirty: true })).toBe(
      'local-changes',
    );
    expect(
      resolveVaultSyncStatus({
        ...baseInput,
        observedRevision: 1,
        remoteRevision: 2,
      }),
    ).toBe('remote-newer');
    expect(
      resolveVaultSyncStatus({
        ...baseInput,
        observedRevision: 2,
        remoteRevision: 2,
      }),
    ).toBe('up-to-date');
  });
});
