import { describe, expect, it } from 'vitest';

import { computeVaultStatus } from '#features/user-settings/model/compute-vault-status';

describe('computeVaultStatus', () => {
  it.each([
    [false, false, undefined, undefined, 'never-synced'],
    [false, true, undefined, undefined, 'local-changes'],
    [true, true, 2, 2, 'local-changes'],
    [true, false, undefined, 1, 'remote-newer'],
    [true, false, 1, 2, 'remote-newer'],
    [true, false, 2, 2, 'up-to-date'],
  ] as const)(
    'returns %s for remote=%s dirty=%s syncedRevision=%s remoteRevision=%s',
    (
      hasRemoteSnapshot,
      isDirty,
      lastSuccessfulSyncRevision,
      remoteRevision,
      expected,
    ) => {
      expect(
        computeVaultStatus(
          hasRemoteSnapshot,
          isDirty,
          lastSuccessfulSyncRevision,
          remoteRevision,
        ),
      ).toBe(expected);
    },
  );
});
