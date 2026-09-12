import { afterEach, describe, expect, it, vi } from 'vitest';

import { captureVaultRestoreScope } from '#features/user-settings/ui/hooks/capture-vault-restore-scope';
import {
  encryptedPersistence,
  persistenceSyncMetadata,
} from '#shared/adapters/persistence';

describe('captureVaultRestoreScope', () => {
  afterEach(() => vi.restoreAllMocks());
  it('should reject the prepared snapshot when a local mutation commits', () => {
    vi.spyOn(encryptedPersistence, 'isUnlocked').mockReturnValue(true);
    const scope = captureVaultRestoreScope();
    expect(scope.assertCurrent).not.toThrow();
    persistenceSyncMetadata.markDirty();
    expect(scope.assertCurrent).toThrow('Vault changed');
  });
  it('should reject the prepared snapshot when sync advances its high-water mark', () => {
    vi.spyOn(encryptedPersistence, 'isUnlocked').mockReturnValue(true);
    const scope = captureVaultRestoreScope();
    persistenceSyncMetadata.rememberRevision(10, 'different');
    expect(scope.assertCurrent).toThrow('Vault changed');
  });
});
