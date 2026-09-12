import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { upgradeRecoveryBackup } from '#features/user-settings/api/upgrade-recovery-backup';
import { encryptedPersistence } from '#shared/adapters/persistence';
import {
  BudgetDatabase,
  getAccountDatabaseName,
  VaultV2Database,
} from '#shared/adapters/persistence/dexie';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import {
  deriveRecoveryPublicKey,
  verifyRecoveryMessage,
} from '#shared/adapters/vault-protocol/recovery-authority';
import { decodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup';
import { encodeRecoveryRegistration } from '#shared/adapters/vault-protocol/recovery-registration/encode';
import { buildRecoveryRegistrationIntent } from '#shared/adapters/vault-protocol/recovery-registration/testing/build-intent';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { apiClient } from '#shared/api';
import { vaultDeviceId } from '#shared/api/vault-protocol/device-id';
import { buildVaultBootstrapMetadata } from '#shared/api/vault-protocol/get-vault-bootstrap/testing/build-vault-bootstrap-metadata';
import { bytesToHex } from '#shared/lib/bytes-to-hex';

afterEach(() => vi.restoreAllMocks());
describe('upgradeRecoveryBackup', () => {
  it.each(['success', 'cancel', 'lock', 'wrong-signer', 'readback-mismatch'])(
    'should preserve VMK and register only after backup confirmation; outcome=%s',
    async (outcome) => {
      const context = {
        accountId: `test-${crypto.randomUUID()}`,
        workspaceId: crypto.randomUUID(),
        vaultId: crypto.randomUUID(),
        keyId: crypto.randomUUID(),
        deviceId: vaultDeviceId.get(),
      };
      encryptedPersistence.setAccountContext(
        context.accountId,
        context.workspaceId,
      );
      const vmk = vaultProtocol.generateVmk();
      let backup: Awaited<ReturnType<typeof decodeRecoveryBackup>> | undefined;
      let confirmed = false;
      try {
        await encryptedPersistence.unlockWithVaultKeys(
          {
            ...(await vaultProtocol.deriveKeys(vmk, context)),
            vmk,
            requiresRemoteRestore: false,
          },
          context,
        );
        const material = encryptedPersistence.getVaultTransferMaterial(context);
        const signingPublicKey = JSON.stringify(
          await deviceSigningKey.exportPublicJwk(material.signingPublicKey),
        );
        material.vmk.fill(0);
        const foreign = await deviceSigningKey.generate();
        const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
          buildVaultBootstrapMetadata({
            vaultId: context.vaultId,
            keyId: context.keyId,
            deviceId: context.deviceId,
          }),
        );
        const post = vi
          .spyOn(apiClient, 'post')
          .mockImplementation(async (path, body) => {
            expect(confirmed).toBe(true);
            if (
              typeof body !== 'object' ||
              body === null ||
              !('vaultId' in body)
            )
              throw new Error('Expected public request');
            expect(JSON.stringify(body)).not.toContain('BF2:');
            expect(JSON.stringify(body)).not.toContain('recoverySeed');
            if (path.endsWith('/prepare')) {
              if (
                !('recoveryPublicKey' in body) ||
                typeof body.recoveryPublicKey !== 'string'
              )
                throw new Error('Expected public authority');
              return buildRecoveryRegistrationIntent({
                ...context,
                recoveryPublicKey: body.recoveryPublicKey,
                signingPublicKey:
                  outcome === 'wrong-signer'
                    ? JSON.stringify(
                        await deviceSigningKey.exportPublicJwk(
                          foreign.publicKey,
                        ),
                      )
                    : signingPublicKey,
              });
            }
            if (
              backup === undefined ||
              !('challenge' in body) ||
              typeof body.challenge !== 'string' ||
              !('deviceSignature' in body) ||
              typeof body.deviceSignature !== 'string' ||
              !('recoverySignature' in body) ||
              typeof body.recoverySignature !== 'string'
            )
              throw new Error('Expected complete proof');
            const deviceSignature = body.deviceSignature;
            const recoverySignature = body.recoverySignature;
            const prepared = await post.mock.results[0]?.value;
            const intent = buildRecoveryRegistrationIntent({
              ...context,
              challenge: body.challenge,
              recoveryPublicKey: bytesToHex(
                deriveRecoveryPublicKey(backup.recoverySeed),
              ),
              signingPublicKey,
            });
            if (
              typeof prepared === 'object' &&
              prepared !== null &&
              'expiresAt' in prepared &&
              typeof prepared.expiresAt === 'string'
            ) {
              const message = encodeRecoveryRegistration({
                ...intent,
                expiresAt: prepared.expiresAt,
              });
              expect(
                verifyRecoveryMessage(
                  deriveRecoveryPublicKey(backup.recoverySeed),
                  message,
                  Uint8Array.from({ length: 64 }, (_, index) =>
                    Number.parseInt(
                      recoverySignature.slice(index * 2, index * 2 + 2),
                      16,
                    ),
                  ),
                ),
              ).toBe(true);
              expect(
                await crypto.subtle.verify(
                  { name: 'ECDSA', hash: 'SHA-256' },
                  await deviceSigningKey.importPublicJwk(
                    JSON.parse(signingPublicKey),
                  ),
                  Uint8Array.from({ length: 64 }, (_, index) =>
                    Number.parseInt(
                      deviceSignature.slice(index * 2, index * 2 + 2),
                      16,
                    ),
                  ),
                  message,
                ),
              ).toBe(true);
            } else throw new Error('Missing prepared intent');
            get.mockResolvedValue(
              buildVaultBootstrapMetadata({
                vaultId: context.vaultId,
                keyId: context.keyId,
                deviceId: context.deviceId,
                recoveryPublicKey:
                  outcome === 'readback-mismatch'
                    ? '0'.repeat(64)
                    : bytesToHex(deriveRecoveryPublicKey(backup.recoverySeed)),
              }),
            );
            return undefined;
          });
        const operation = upgradeRecoveryBackup(
          async (code) => {
            expect(post).not.toHaveBeenCalled();
            backup = await decodeRecoveryBackup(code);
            expect(backup.vmk).toEqual(vmk);
            expect(backup.recoverySeed).not.toEqual(vmk);
            confirmed = outcome !== 'cancel';
            if (outcome === 'lock') encryptedPersistence.lock();
            return confirmed;
          },
          () => {},
        );
        if (outcome === 'success') expect(await operation).toBe('registered');
        else if (outcome === 'cancel')
          expect(await operation).toBe('cancelled');
        else await expect(operation).rejects.toThrow();
        expect(post).toHaveBeenCalledTimes(
          outcome === 'success' || outcome === 'readback-mismatch'
            ? 2
            : outcome === 'wrong-signer'
              ? 1
              : 0,
        );
      } finally {
        encryptedPersistence.lock();
        vmk.fill(0);
        backup?.vmk.fill(0);
        backup?.recoverySeed.fill(0);
        await new VaultV2Database(
          context.accountId,
          context.workspaceId,
          context.vaultId,
        ).delete();
        await new BudgetDatabase(
          getAccountDatabaseName(context.accountId, context.workspaceId),
        ).delete();
      }
    },
  );
});
