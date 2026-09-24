import type { Page } from '@playwright/test';

const recoveryCode =
  'BF2:000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f8663a88d';

const buildSnapshot = async (page: Page): Promise<Record<string, unknown>> =>
  page.evaluate(async () => {
    const { createVaultPayload, serializeVaultPayload } =
      await import('/src/features/user-settings/index.ts');
    const { deviceSigningKey } =
      await import('/src/shared/adapters/vault-protocol/device-signing-key.ts');
    const { vaultDeviceId } =
      await import('/src/shared/api/vault-protocol/device-id.ts');
    const { vaultProtocol } =
      await import('/src/shared/adapters/vault-protocol/vault-protocol.ts');
    const context = {
      accountId: 'user-e2e',
      workspaceId: 'workspace-e2e',
      vaultId: 'vault-e2e',
      keyId: 'key-e2e',
      deviceId: vaultDeviceId.get(),
    };
    const vmk = new Uint8Array(Array.from({ length: 32 }, (_, index) => index));
    const keys = await vaultProtocol.deriveKeys(vmk, context);
    const signing = await deviceSigningKey.generate();
    const envelope = await vaultProtocol.createSnapshot(
      serializeVaultPayload(
        createVaultPayload({
          transactions: [],
          rules: [],
          categories: [],
          budgets: [],
          periodHistory: [],
          importHistory: [],
        }),
      ),
      {
        accountId: context.accountId,
        workspaceId: context.workspaceId,
        vaultId: context.vaultId,
        keyId: context.keyId,
        formatVersion: 2,
        cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
        revision: 1,
        previousEnvelopeHash: `${'A'.repeat(43)}=`,
        createdByDeviceId: context.deviceId,
        createdAt: '2026-01-01T00:00:00.000Z',
        nonce: '',
      },
      keys.sync,
      signing.privateKey,
    );
    const snapshot = {
      vaultId: context.vaultId,
      keyId: context.keyId,
      deviceId: context.deviceId,
      revision: 1,
      previousEnvelopeHash: envelope.header.previousEnvelopeHash,
      envelopeHash: await vaultProtocol.hashEnvelope(envelope),
      header: JSON.stringify(envelope.header),
      ciphertext: envelope.ciphertext,
      signature: envelope.signature,
      signingPublicKey: JSON.stringify(
        await deviceSigningKey.exportPublicJwk(signing.publicKey),
      ),
      createdAt: envelope.header.createdAt,
    };
    vmk.fill(0);
    return snapshot;
  });

const installSnapshot = async (page: Page): Promise<void> => {
  const snapshot = await buildSnapshot(page);
  await page.route('**/api/users/me/vault/sync/vault-e2e', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'available', snapshot }),
        })
      : route.fallback(),
  );
};

export const recoveryVaultFixture = { recoveryCode, installSnapshot };
