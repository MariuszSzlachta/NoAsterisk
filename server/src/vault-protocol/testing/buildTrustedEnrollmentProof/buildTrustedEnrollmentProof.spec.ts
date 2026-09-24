import { buildTrustedEnrollmentProof } from '@vault-protocol/testing/buildTrustedEnrollmentProof';
import { buildVaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture';
import { trustedDeviceProof } from '@vault-protocol/infrastructure/verify-trusted-device-proof';
describe('buildTrustedEnrollmentProof', () => {
  it('creates a native verifiable device approval', async () => {
    const fixture = buildVaultSignatureFixture();
    const context = {
      accountId: 'a',
      workspaceId: 'w',
      vaultId: 'v',
      keyId: 'k',
      oldDeviceId: 'old',
      newDeviceId: 'new',
    };
    expect(
      await trustedDeviceProof.verify({
        proof: buildTrustedEnrollmentProof(context, fixture),
        context,
        expectedSigningPublicKey: fixture.devicePublicKey,
      }),
    ).toBe(true);
  });
});
