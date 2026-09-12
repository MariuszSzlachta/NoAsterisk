import { describe, expect, it } from 'vitest';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { trustedDeviceEnrollment } from '#shared/adapters/vault-protocol/trusted-device-enrollment';

const context = {
  accountId: 'account-1',
  workspaceId: 'workspace-1',
  vaultId: 'vault-1',
  keyId: 'key-1',
  oldDeviceId: 'old-device-1',
  newDeviceId: 'new-device-1',
} as const;

describe('trustedDeviceEnrollment', () => {
  it('roundtrips a VMK through an authenticated two-device QR response', async () => {
    const request = await trustedDeviceEnrollment.createRequest(context);
    const signing = await deviceSigningKey.generate();
    const signingPublicKey = await deviceSigningKey.exportPublicJwk(
      signing.publicKey,
    );
    const vmk = new Uint8Array(32).fill(0x2a);

    const response = await trustedDeviceEnrollment.createResponse(
      request.request,
      vmk,
      signing,
      signingPublicKey,
    );
    const restored = await trustedDeviceEnrollment.decryptResponse(
      response,
      request.request,
      request.privateKey,
      signingPublicKey,
    );

    expect(restored).toEqual(vmk);
    expect(JSON.stringify(response)).not.toContain('2a2a2a');
    vmk.fill(0);
    restored.fill(0);
  });

  it('rejects context substitution, tampering and wrong signer before decrypting', async () => {
    const request = await trustedDeviceEnrollment.createRequest(context);
    const signing = await deviceSigningKey.generate();
    const signingPublicKey = await deviceSigningKey.exportPublicJwk(
      signing.publicKey,
    );
    const response = await trustedDeviceEnrollment.createResponse(
      request.request,
      new Uint8Array(32).fill(7),
      signing,
      signingPublicKey,
    );

    await expect(
      trustedDeviceEnrollment.decryptResponse(
        { ...response, newDeviceId: 'other-device' },
        request.request,
        request.privateKey,
        signingPublicKey,
      ),
    ).rejects.toThrow('context mismatch');

    await expect(
      trustedDeviceEnrollment.decryptResponse(
        { ...response, ciphertext: `${response.ciphertext.slice(0, -2)}AA` },
        request.request,
        request.privateKey,
        signingPublicKey,
      ),
    ).rejects.toThrow();

    const otherSigning = await deviceSigningKey.generate();
    const otherPublicKey = await deviceSigningKey.exportPublicJwk(
      otherSigning.publicKey,
    );
    await expect(
      trustedDeviceEnrollment.decryptResponse(
        response,
        request.request,
        request.privateKey,
        otherPublicKey,
      ),
    ).rejects.toThrow('context mismatch');
  });

  it('rejects malformed, oversized and wrong-length payloads', async () => {
    await expect(
      trustedDeviceEnrollment.createResponse(
        { kind: 'budgetflow/trusted-device-qr' },
        new Uint8Array(32),
        await deviceSigningKey.generate(),
        { kty: 'EC', crv: 'P-256', x: 'x', y: 'y' },
      ),
    ).rejects.toThrow('Invalid trusted-device request');

    const request = await trustedDeviceEnrollment.createRequest(context);
    const signing = await deviceSigningKey.generate();
    const publicKey = await deviceSigningKey.exportPublicJwk(signing.publicKey);
    await expect(
      trustedDeviceEnrollment.createResponse(
        request.request,
        new Uint8Array(31),
        signing,
        publicKey,
      ),
    ).rejects.toThrow('VMK must contain 32 bytes');
  });
});
