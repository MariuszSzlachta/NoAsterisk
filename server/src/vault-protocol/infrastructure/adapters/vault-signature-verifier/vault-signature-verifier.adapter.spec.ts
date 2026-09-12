import { VaultSignatureVerifierAdapter } from '@vault-protocol/infrastructure/adapters/vault-signature-verifier';
import { buildVaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture';

describe('VaultSignatureVerifierAdapter', () => {
  it('should verify real device and recovery signatures over the exact message', async () => {
    const fixture = buildVaultSignatureFixture();
    const verifier = new VaultSignatureVerifierAdapter();
    await expect(
      verifier.verifyDevice(
        fixture.devicePublicKey,
        fixture.message,
        fixture.deviceSignature,
      ),
    ).resolves.toBe(true);
    await expect(
      verifier.verifyRecovery(
        fixture.recoveryPublicKey,
        fixture.message,
        fixture.recoverySignature,
      ),
    ).resolves.toBe(true);
    await expect(
      verifier.verifyDevice(
        fixture.devicePublicKey,
        Uint8Array.of(1),
        fixture.deviceSignature,
      ),
    ).resolves.toBe(false);
    await expect(
      verifier.verifyRecovery(
        fixture.recoveryPublicKey,
        Uint8Array.of(1),
        fixture.recoverySignature,
      ),
    ).resolves.toBe(false);
  });

  it('should accept the RFC-8032 section 7.1 vector', async () => {
    await expect(
      new VaultSignatureVerifierAdapter().verifyRecovery(
        'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a',
        new Uint8Array(),
        'e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b',
      ),
    ).resolves.toBe(true);
  });

  it('should reject the small-order identity forgery accepted by native OpenSSL', async () => {
    const identity = `01${'00'.repeat(31)}`;
    const signature = identity + '00'.repeat(32);
    await expect(
      new VaultSignatureVerifierAdapter().verifyRecovery(
        identity,
        Uint8Array.of(1),
        signature,
      ),
    ).resolves.toBe(false);
  });

  it.each([
    '',
    '00',
    'a'.repeat(127),
    'a'.repeat(129),
    'A'.repeat(128),
    `${'a'.repeat(128)}\n`,
  ])(
    'should reject malformed signatures before native decoding',
    async (signature) => {
      const fixture = buildVaultSignatureFixture();
      const verifier = new VaultSignatureVerifierAdapter();
      await expect(
        verifier.verifyDevice(
          fixture.devicePublicKey,
          fixture.message,
          signature,
        ),
      ).resolves.toBe(false);
      await expect(
        verifier.verifyRecovery(
          fixture.recoveryPublicKey,
          fixture.message,
          signature,
        ),
      ).resolves.toBe(false);
    },
  );

  it('should reject private, malformed or oversized device public keys', async () => {
    const fixture = buildVaultSignatureFixture();
    const verifier = new VaultSignatureVerifierAdapter();
    await expect(
      verifier.verifyDevice(
        JSON.stringify(fixture.devicePrivateKey.export({ format: 'jwk' })),
        fixture.message,
        fixture.deviceSignature,
      ),
    ).resolves.toBe(false);
    await expect(
      verifier.verifyDevice('{', fixture.message, fixture.deviceSignature),
    ).resolves.toBe(false);
    await expect(
      verifier.verifyDevice(
        'a'.repeat(10_001),
        fixture.message,
        fixture.deviceSignature,
      ),
    ).resolves.toBe(false);
    await expect(
      verifier.verifyRecovery('00', fixture.message, fixture.recoverySignature),
    ).resolves.toBe(false);
  });

  it('should reject oversized messages in both verification paths', async () => {
    const fixture = buildVaultSignatureFixture();
    const verifier = new VaultSignatureVerifierAdapter();
    const message = new Uint8Array(65_537);
    await expect(
      verifier.verifyDevice(
        fixture.devicePublicKey,
        message,
        fixture.deviceSignature,
      ),
    ).resolves.toBe(false);
    await expect(
      verifier.verifyRecovery(
        fixture.recoveryPublicKey,
        message,
        fixture.recoverySignature,
      ),
    ).resolves.toBe(false);
  });
});
