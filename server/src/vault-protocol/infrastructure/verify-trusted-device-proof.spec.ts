import { webcrypto } from 'node:crypto';
import { trustedDeviceProof } from './verify-trusted-device-proof';

const context = {
  accountId: 'account-1',
  workspaceId: 'workspace-1',
  vaultId: 'vault-1',
  keyId: 'key-1',
  oldDeviceId: 'old-device-1',
  newDeviceId: 'new-device-1',
};

const canonicalize = (value: unknown): string => {
  const sorted = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(sorted);
    if (typeof item !== 'object' || item === null) return item;
    return Object.fromEntries(
      Object.keys(item)
        .sort()
        .map((key) => [
          key,
          sorted(Object.entries(item).find(([name]) => name === key)?.[1]),
        ]),
    );
  };
  return JSON.stringify(sorted(value));
};

const createProof = async (): Promise<{
  readonly proof: string;
  readonly publicKey: string;
}> => {
  const signer = await webcrypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
  const signingPublicKey = await webcrypto.subtle.exportKey(
    'jwk',
    signer.publicKey,
  );
  const unsigned = {
    ...context,
    formatVersion: 1,
    kind: 'budgetflow/trusted-device-qr',
    requestId: 'request-1',
    oldEphemeralPublicKey: {
      kty: 'EC',
      crv: 'P-256',
      x: 'x',
      y: 'y',
    },
    signingPublicKey,
    nonce: Buffer.alloc(12, 1).toString('base64'),
    ciphertext: Buffer.alloc(32, 2).toString('base64'),
  };
  const payload = canonicalize({
    domain: 'budgetflow/trusted-device-qr/v1',
    ...unsigned,
  });
  const signature = await webcrypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signer.privateKey,
    new TextEncoder().encode(payload),
  );
  return {
    proof: JSON.stringify({
      ...unsigned,
      signature: Buffer.from(signature).toString('base64'),
    }),
    publicKey: JSON.stringify(signingPublicKey),
  };
};

describe('trustedDeviceProof', () => {
  it('verifies a signed ciphertext-only approval', async () => {
    const fixture = await createProof();

    await expect(
      trustedDeviceProof.verify({
        proof: fixture.proof,
        context,
        expectedSigningPublicKey: fixture.publicKey,
      }),
    ).resolves.toBe(true);
  });

  it('rejects signature, signer and context substitutions', async () => {
    const fixture = await createProof();
    const parsedValue: unknown = JSON.parse(fixture.proof);
    if (
      typeof parsedValue !== 'object' ||
      parsedValue === null ||
      Array.isArray(parsedValue)
    ) {
      throw new Error('Expected proof object');
    }
    const parsed = Object.fromEntries(Object.entries(parsedValue));

    await expect(
      trustedDeviceProof.verify({
        proof: JSON.stringify({
          ...parsed,
          ciphertext: Buffer.alloc(32, 3).toString('base64'),
        }),
        context,
        expectedSigningPublicKey: fixture.publicKey,
      }),
    ).resolves.toBe(false);
    await expect(
      trustedDeviceProof.verify({
        proof: fixture.proof,
        context: { ...context, newDeviceId: 'other-device' },
        expectedSigningPublicKey: fixture.publicKey,
      }),
    ).resolves.toBe(false);
    await expect(
      trustedDeviceProof.verify({
        proof: fixture.proof,
        context,
        expectedSigningPublicKey: JSON.stringify({
          kty: 'EC',
          crv: 'P-256',
          x: 'other',
          y: 'other',
        }),
      }),
    ).resolves.toBe(false);
  });

  it('fails closed for malformed and oversized proofs', async () => {
    await expect(
      trustedDeviceProof.verify({
        proof: '{"ciphertext":"x"}',
        context,
        expectedSigningPublicKey: '{}',
      }),
    ).resolves.toBe(false);
    const fixture = await createProof();
    await expect(
      trustedDeviceProof.verify({
        proof: `${fixture.proof}${'x'.repeat(64_000)}`,
        context,
        expectedSigningPublicKey: fixture.publicKey,
      }),
    ).resolves.toBe(false);
  });
});
