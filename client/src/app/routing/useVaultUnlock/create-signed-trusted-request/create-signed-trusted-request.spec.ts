import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSignedTrustedRequest } from '#app/routing/useVaultUnlock/create-signed-trusted-request';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { vaultEnrollment } from '#shared/api/vault-protocol/vault-enrollment';

const boundary = vi.hoisted(() => ({
  prepare: vi.fn<typeof vaultEnrollment.prepare>(),
}));
vi.mock('#shared/api/vault-protocol/vault-enrollment', () => ({
  vaultEnrollment: boundary,
}));

describe('createSignedTrustedRequest', () => {
  const context = {
    accountId: 'account',
    workspaceId: 'workspace',
    vaultId: 'vault',
    keyId: 'key',
    oldDeviceId: 'approver',
    newDeviceId: 'device',
  };
  beforeEach(() => {
    vi.resetAllMocks();
    boundary.prepare.mockImplementation(async (input) => {
      if (input.purpose !== 'trusted')
        throw new Error('Expected trusted preparation');
      const createdAt = Date.now();
      return {
        serverShare: btoa(String.fromCharCode(...new Uint8Array(32))),
        intent: {
          ...input,
          accountId: context.accountId,
          workspaceId: context.workspaceId,
          challenge: 'A'.repeat(43),
          createdAt,
          expiresAt: createdAt + 60_000,
          deviceEnvelope: '{}',
          delegationDigest: '0'.repeat(64),
        },
      };
    });
  });

  it('keeps the exact pre-generated signing key and binds the ephemeral transfer to the server nonce', async () => {
    const pending = await createSignedTrustedRequest(context, () => {});
    const exported = JSON.stringify(
      await deviceSigningKey.exportPublicJwk(pending.signingKeyPair.publicKey),
    );
    expect(pending.prepared.intent.signingPublicKey).toBe(exported);
    expect(boundary.prepare.mock.calls[0]?.[0].signingPublicKey).toBe(exported);
    expect(pending.request.transferRequest.requestId).toBe(
      pending.prepared.intent.challenge,
    );
    expect(
      JSON.stringify(pending.request.transferRequest.newEphemeralPublicKey),
    ).toBe(
      pending.prepared.intent.purpose === 'trusted'
        ? pending.prepared.intent.newEphemeralPublicKey
        : undefined,
    );
    expect(pending.signingKeyPair.privateKey.extractable).toBe(false);
    expect(JSON.stringify(pending.request)).not.toContain('privateKey');
    expect(JSON.stringify(pending.request)).not.toContain('serverShare');
  });

  it('rejects a server preparation assigned to another account before publishing any request', async () => {
    const prepare = boundary.prepare.getMockImplementation();
    if (prepare === undefined)
      throw new Error('Expected native boundary fixture');
    boundary.prepare.mockImplementation(async (input) => {
      const response = await prepare(input);
      return {
        ...response,
        intent: { ...response.intent, accountId: 'other' },
      };
    });
    await expect(createSignedTrustedRequest(context, () => {})).rejects.toThrow(
      'context mismatch',
    );
  });
  it('should reject an invalidated operation before preparing a backend challenge', async () => {
    await expect(
      createSignedTrustedRequest(context, () => {
        throw new Error('Cancelled');
      }),
    ).rejects.toThrow('Cancelled');
    expect(boundary.prepare).not.toHaveBeenCalled();
  });
});
