import { describe, expect, it } from 'vitest';

import { unlockCoordinator } from '#shared/adapters/vault-protocol/unlock-coordinator';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { vaultProtocolConstants } from '#shared/adapters/vault-protocol/vault-protocol-constants';

const context = {
  accountId: 'account',
  workspaceId: 'workspace',
  vaultId: 'vault',
  keyId: 'key',
  deviceId: 'device',
  credentialId: 'credential',
};

describe('unlockCoordinator', () => {
  it('unlocks Standard mode through LocalShare + transient ServerShare', async () => {
    const localShare = await vaultProtocol.generateLocalShare();
    const serverShare = new Uint8Array(32).fill(3);
    const wrappingKey = await vaultProtocol.deriveDeviceKey(
      localShare,
      serverShare,
      context,
    );
    const envelope = await vaultProtocol.wrapVmk(
      vaultProtocol.generateVmk(),
      wrappingKey,
      context,
      vaultProtocolConstants.deviceWrapPurpose,
    );
    const result = await unlockCoordinator.unlock({
      mode: 'standard',
      localShare,
      serverShare,
      envelope,
      context,
    });
    expect(result.method).toBe('split');
    expect(result.local.extractable).toBe(false);
    expect(result.sync.extractable).toBe(false);
  });

  it('uses PRF when confirmed and refuses high-security fallback', async () => {
    const localShare = await vaultProtocol.generateLocalShare();
    const serverShare = new Uint8Array(32).fill(4);
    const prfKey = await vaultProtocol.importPrfOutput(
      new Uint8Array(32).fill(5),
    );
    const prfContext = { ...context, credentialId: 'credential' };
    const wrappingKey = await vaultProtocol.derivePrfKey(
      prfKey,
      serverShare,
      prfContext,
    );
    const envelope = await vaultProtocol.wrapVmk(
      vaultProtocol.generateVmk(),
      wrappingKey,
      prfContext,
      vaultProtocolConstants.passkeyWrapPurpose,
    );
    await expect(
      unlockCoordinator.unlock({
        mode: 'high-security',
        localShare,
        serverShare,
        envelope,
        context: prfContext,
      }),
    ).rejects.toThrow('requires confirmed passkey PRF');
    await expect(
      unlockCoordinator.unlock({
        mode: 'high-security',
        localShare,
        serverShare,
        envelope,
        context: prfContext,
        prfKey,
      }),
    ).resolves.toMatchObject({ method: 'prf' });
  });

  it('does not require or create LocalShare for PRF-only unlock', async () => {
    const serverShare = new Uint8Array(32).fill(6);
    const prfKey = await vaultProtocol.importPrfOutput(
      new Uint8Array(32).fill(7),
    );
    const prfContext = { ...context, credentialId: 'credential' };
    const wrappingKey = await vaultProtocol.derivePrfKey(
      prfKey,
      serverShare,
      prfContext,
    );
    const envelope = await vaultProtocol.wrapVmk(
      vaultProtocol.generateVmk(),
      wrappingKey,
      prfContext,
      vaultProtocolConstants.passkeyWrapPurpose,
    );

    await expect(
      unlockCoordinator.unlock({
        mode: 'high-security',
        serverShare,
        envelope,
        context: prfContext,
        prfKey,
      }),
    ).resolves.toMatchObject({ method: 'prf' });
  });
});
