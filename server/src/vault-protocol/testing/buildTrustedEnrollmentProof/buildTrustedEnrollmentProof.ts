import { generateKeyPairSync, sign } from 'node:crypto';
import { canonicalFixtureJson } from '@vault-protocol/testing/canonicalFixtureJson';
import type { VaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture/types';
interface ProofContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly oldDeviceId: string;
  readonly newDeviceId: string;
}
export const buildTrustedEnrollmentProof = (
  context: ProofContext,
  fixture: VaultSignatureFixture,
): string => {
  const ephemeral = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const signingPublicKey: unknown = JSON.parse(fixture.devicePublicKey);
  const unsigned = {
    ...context,
    formatVersion: 1,
    kind: 'budgetflow/trusted-device-qr',
    requestId: 'synthetic-request',
    oldEphemeralPublicKey: ephemeral.publicKey.export({ format: 'jwk' }),
    signingPublicKey,
    nonce: Buffer.alloc(12, 1).toString('base64'),
    ciphertext: Buffer.alloc(32, 2).toString('base64'),
  };
  const message = new TextEncoder().encode(
    JSON.stringify(
      canonicalFixtureJson({
        domain: 'budgetflow/trusted-device-qr/v1',
        ...unsigned,
      }),
    ),
  );
  const signature = sign('sha256', message, {
    key: fixture.devicePrivateKey,
    dsaEncoding: 'ieee-p1363',
  }).toString('base64');
  return JSON.stringify({ ...unsigned, signature });
};
