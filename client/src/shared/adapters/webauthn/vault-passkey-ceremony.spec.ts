import { beforeEach, describe, expect, it, vi } from 'vitest';

import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { passkeyPrf } from '#shared/adapters/webauthn/passkey-prf';
import { webauthnChallenge } from '#shared/api/vault-protocol/webauthn-challenge';
import { vaultPasskeyCeremony } from './vault-passkey-ceremony';

vi.mock('#shared/adapters/vault-protocol/vault-protocol', () => ({
  vaultProtocol: { canonicalize: vi.fn(() => 'stable-canonical') },
}));
vi.mock('#shared/adapters/webauthn/passkey-prf', () => ({
  passkeyPrf: { run: vi.fn() },
}));
vi.mock('#shared/api/vault-protocol/webauthn-challenge', () => ({
  webauthnChallenge: { createAuthenticationChallengeRecord: vi.fn() },
}));
vi.mock('#shared/api/vault-protocol/webauthn-credentials', () => ({
  webauthnCredentials: { verifyAuthentication: vi.fn() },
}));

describe('vaultPasskeyCeremony', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(webauthnChallenge.createAuthenticationChallengeRecord).mockResolvedValue({
      bytes: new Uint8Array([1, 2, 3]),
      encoded: 'challenge',
    });
    vi.mocked(passkeyPrf.run).mockResolvedValue({
      credentialId: 'credential-1',
      prfKey: {},
      assertion: {
        id: 'credential-1',
        rawId: 'raw-id',
        type: 'public-key',
        response: {
          clientDataJSON: 'client',
          authenticatorData: 'auth',
          signature: 'signature',
        },
      },
    });
  });

  it('uses the same public PRF input after a key rotation', async () => {
    const first = await vaultPasskeyCeremony.run({
      accountId: 'account-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
    });
    const second = await vaultPasskeyCeremony.run({
      accountId: 'account-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-2',
      deviceId: 'device-1',
    });

    expect(first.credentialId).toBe(second.credentialId);
    expect(vi.mocked(vaultProtocol.canonicalize).mock.calls).toEqual([
      [{
        domain: 'budgetflow/passkey-prf-salt/v1',
        accountId: 'account-1',
        workspaceId: 'workspace-1',
        vaultId: 'vault-1',
        deviceId: 'device-1',
      }],
      [{
        domain: 'budgetflow/passkey-prf-salt/v1',
        accountId: 'account-1',
        workspaceId: 'workspace-1',
        vaultId: 'vault-1',
        deviceId: 'device-1',
      }],
    ]);
  });
});
