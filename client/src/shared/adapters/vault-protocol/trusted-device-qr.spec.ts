import { describe, expect, it } from 'vitest';
import { trustedDeviceEnrollment } from '#shared/adapters/vault-protocol/trusted-device-enrollment';
import { trustedDeviceQr } from '#shared/adapters/vault-protocol/trusted-device-qr';

describe('trustedDeviceQr', () => {
  it('roundtrips a request payload and renders a transient SVG', async () => {
    const result = await trustedDeviceEnrollment.createRequest({
      accountId: 'account',
      workspaceId: 'workspace',
      vaultId: 'vault',
      keyId: 'key',
      oldDeviceId: 'old-device',
      newDeviceId: 'new-device',
    });
    const encoded = trustedDeviceQr.encode(result.request);
    expect(trustedDeviceQr.parse(encoded)).toEqual(result.request);
    await expect(trustedDeviceQr.render(result.request)).resolves.toContain(
      '<svg',
    );
  });

  it('rejects malformed, wrong-version and oversized payloads', () => {
    expect(() => trustedDeviceQr.parse('not-json')).toThrow();
    expect(() =>
      trustedDeviceQr.parse(
        JSON.stringify({ kind: 'budgetflow/trusted-device-qr', formatVersion: 2 }),
      ),
    ).toThrow();
    expect(() => trustedDeviceQr.parse('x'.repeat(32_769))).toThrow();
  });
});
