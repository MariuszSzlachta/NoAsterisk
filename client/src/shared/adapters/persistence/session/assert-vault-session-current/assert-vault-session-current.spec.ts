import { describe, expect, it } from 'vitest';

import { assertVaultSessionCurrent } from '#shared/adapters/persistence/session/assert-vault-session-current';
import type {
  VaultSessionContext,
  VaultSessionReader,
} from '#shared/adapters/persistence/session/assert-vault-session-current/types';

const buildContext = (
  overrides: Partial<VaultSessionContext> = {},
): VaultSessionContext => ({
  accountId: 'account',
  workspaceId: 'workspace',
  vaultId: 'vault',
  keyId: 'key',
  deviceId: 'device',
  ...overrides,
});
const buildSession = (
  overrides: Partial<VaultSessionReader> = {},
): VaultSessionReader => ({
  isUnlocked: () => true,
  getGeneration: () => 1,
  requireVaultSyncMaterial: () => ({ context: buildContext() }),
  ...overrides,
});

describe('assertVaultSessionCurrent', () => {
  it('should accept the current session when contexts have equal identities', () => {
    expect(() =>
      assertVaultSessionCurrent(buildSession(), 1, buildContext()),
    ).not.toThrow();
  });
  it('should reject the operation when the vault is locked', () => {
    expect(() =>
      assertVaultSessionCurrent(
        buildSession({ isUnlocked: () => false }),
        1,
        buildContext(),
      ),
    ).toThrow('session changed');
  });
  it('should reject an old operation when a new session is unlocked', () => {
    expect(() =>
      assertVaultSessionCurrent(
        buildSession({ getGeneration: () => 2 }),
        1,
        buildContext(),
      ),
    ).toThrow('session changed');
  });
  it.each(['accountId', 'workspaceId', 'vaultId', 'keyId', 'deviceId'])(
    'should reject the operation when %s changes',
    (field) => {
      const changed = { ...buildContext(), [field]: 'different' };
      expect(() =>
        assertVaultSessionCurrent(
          buildSession({
            requireVaultSyncMaterial: () => ({ context: changed }),
          }),
          1,
          buildContext(),
        ),
      ).toThrow('context changed');
    },
  );
});
