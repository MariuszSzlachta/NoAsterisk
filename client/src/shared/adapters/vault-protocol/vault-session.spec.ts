import { describe, expect, it } from 'vitest';

import { createVaultSession } from '#shared/adapters/vault-protocol/vault-session';

const context = {
  accountId: 'account',
  workspaceId: 'workspace',
  vaultId: 'vault',
  keyId: 'key',
};

describe('vault session lifecycle', () => {
  it('clears derived key references on lock', async () => {
    const session = createVaultSession();
    await session.unlock(new Uint8Array(32), context);
    expect(session.isUnlocked()).toBe(true);
    session.lock();
    expect(session.isUnlocked()).toBe(false);
    expect(() => session.requireKeys()).toThrow('locked');
  });

  it('prevents an operation started before lock from completing as a write', async () => {
    const session = createVaultSession();
    await session.unlock(new Uint8Array(32), context);
    let release: () => void = () => undefined;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const operation = session.runIfCurrent(async () => {
      await waiting;
      return 'write';
    });
    session.lock();
    release();
    await expect(operation).rejects.toThrow('cancelled');
  });
});
