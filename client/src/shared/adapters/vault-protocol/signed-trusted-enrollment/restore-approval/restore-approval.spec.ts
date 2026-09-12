import { describe, expect, it } from 'vitest';

import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { restoreSignedTrustedApproval } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/restore-approval';
import { createSignedTrustedFixture } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/testing/create-signed-trusted-fixture';

describe('restoreSignedTrustedApproval', () => {
  it('restores the VMK only through both real delegation and encrypted-transfer proofs', async () => {
    const fixture = await createSignedTrustedFixture();
    const restored = await restoreSignedTrustedApproval(
      fixture.response,
      fixture.request,
      fixture.privateKey,
      fixture.approvingPublicKey,
    );
    try {
      expect(restored).toEqual(fixture.vmk);
    } finally {
      restored.fill(0);
      fixture.vmk.fill(0);
    }
  });

  it('rejects changing the new signing key, server nonce, lifetime or scope, even in both outer messages', async () => {
    const fixture = await createSignedTrustedFixture();
    const substitutions = [
      { signingPublicKey: '{}' },
      { challenge: 'B'.repeat(43) },
      {
        createdAt: fixture.request.intent.createdAt + 1,
        expiresAt: fixture.request.intent.expiresAt + 1,
      },
      { workspaceId: 'other' },
    ];
    try {
      for (const substitution of substitutions) {
        const intent = { ...fixture.request.intent, ...substitution };
        await expect(
          restoreSignedTrustedApproval(
            { ...fixture.response, intent },
            { ...fixture.request, intent },
            fixture.privateKey,
            fixture.approvingPublicKey,
          ),
        ).rejects.toThrow();
      }
    } finally {
      fixture.vmk.fill(0);
    }
  });

  it('rejects a valid delegation from the wrong signer, tampered ciphertext and a substituted transfer recipient', async () => {
    const fixture = await createSignedTrustedFixture();
    const otherKey = await deviceSigningKey.generate();
    const otherPublicKey = await deviceSigningKey.exportPublicJwk(
      otherKey.publicKey,
    );
    try {
      await expect(
        restoreSignedTrustedApproval(
          fixture.response,
          fixture.request,
          fixture.privateKey,
          otherPublicKey,
        ),
      ).rejects.toThrow();
      for (const transferResponse of [
        { ...fixture.response.transferResponse, newDeviceId: 'other' },
        {
          ...fixture.response.transferResponse,
          ciphertext: `${fixture.response.transferResponse.ciphertext.slice(0, -2)}AA`,
        },
      ]) {
        await expect(
          restoreSignedTrustedApproval(
            { ...fixture.response, transferResponse },
            fixture.request,
            fixture.privateKey,
            fixture.approvingPublicKey,
          ),
        ).rejects.toThrow();
      }
    } finally {
      fixture.vmk.fill(0);
    }
  });

  it('rejects replaying an expired approval without returning key material', async () => {
    const fixture = await createSignedTrustedFixture();
    const expiresAt = Date.now() - 1;
    const intent = {
      ...fixture.request.intent,
      createdAt: expiresAt - 60_000,
      expiresAt,
    };
    try {
      await expect(
        restoreSignedTrustedApproval(
          { ...fixture.response, intent },
          { ...fixture.request, intent },
          fixture.privateKey,
          fixture.approvingPublicKey,
        ),
      ).rejects.toThrow();
    } finally {
      fixture.vmk.fill(0);
    }
  });
});
