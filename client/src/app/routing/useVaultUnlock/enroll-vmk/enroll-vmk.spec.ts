import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enrollVmk } from '#app/routing/useVaultUnlock/enroll-vmk';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import {
  encodeEnrollmentConfirmation,
  encodeEnrollmentFinalize,
  type EnrollmentTranscriptSnapshot,
  type SignedEnrollmentInput,
} from '#shared/adapters/vault-protocol/enrollment-transcript';
import { hashEnrollmentMessage } from '#shared/adapters/vault-protocol/enrollment-transcript/hash-message';
import { enrollmentHexPattern } from '#shared/adapters/vault-protocol/enrollment-transcript/hex.pattern';
import {
  deriveRecoveryPublicKey,
  verifyRecoveryMessage,
} from '#shared/adapters/vault-protocol/recovery-authority';
import { createSignedTrustedFixture } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/testing/create-signed-trusted-fixture';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { vaultProtocolConstants } from '#shared/adapters/vault-protocol/vault-protocol-constants';
import { vaultEnrollment } from '#shared/api/vault-protocol/vault-enrollment';

const boundary = vi.hoisted(() => ({
  prepare: vi.fn<typeof vaultEnrollment.prepare>(),
  finalize: vi.fn<typeof vaultEnrollment.finalize>(),
  confirm: vi.fn<typeof vaultEnrollment.confirm>(),
  unlock: vi.fn<typeof encryptedPersistence.unlockWithVaultKeys>(),
  lock: vi.fn(),
}));
vi.mock('#shared/api/vault-protocol/vault-enrollment', () => ({
  vaultEnrollment: boundary,
}));
vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    unlockWithVaultKeys: boundary.unlock,
    lock: boundary.lock,
  },
}));
vi.mock('#app/providers/hydrate-financial-stores', () => ({
  hydrateFinancialStores: vi.fn(),
}));
vi.mock('#app/routing/useVaultUnlock/prepare-enrollment-restore', () => ({
  prepareEnrollmentRestore: vi.fn(async () => async () => undefined),
}));
vi.mock('#app/routing/useVaultUnlock/complete-enrollment-restore', () => ({
  completeEnrollmentRestore: vi.fn(async () => undefined),
}));

describe('enrollVmk', () => {
  const serverShare = new Uint8Array(32).fill(3);
  beforeEach(() => {
    vi.resetAllMocks();
    boundary.prepare.mockImplementation(
      async (input: SignedEnrollmentInput) => {
        const createdAt = Date.now();
        const common = {
          ...input,
          accountId: 'account',
          workspaceId: 'workspace',
          challenge: 'A'.repeat(43),
          createdAt,
          expiresAt: createdAt + 60_000,
          deviceEnvelope: '{}',
        };
        return {
          serverShare: btoa(String.fromCharCode(...serverShare)),
          intent:
            input.purpose === 'trusted'
              ? { ...common, ...input, delegationDigest: '0'.repeat(64) }
              : { ...common, ...input },
        };
      },
    );
    boundary.finalize.mockResolvedValue(undefined);
    boundary.confirm.mockResolvedValue(undefined);
    boundary.unlock.mockImplementation(
      async (_material, _context, initialize) => {
        await initialize?.(() => true);
      },
    );
  });

  it.each(['initial', 'recovery'])(
    'creates a real split envelope and binds both %s proofs and confirmation',
    async (purpose) => {
      const vmk = new Uint8Array(32).fill(7);
      const recoverySeed = new Uint8Array(32).fill(9);
      try {
        await enrollVmk(
          'account',
          'workspace',
          {
            status: purpose === 'initial' ? 'empty' : 'enrollment-required',
            vaultId: 'vault',
            keyId: 'key',
            deviceId: 'device',
          },
          vmk,
          () => {},
          purpose === 'initial'
            ? { purpose: 'initial', recoverySeed }
            : { purpose: 'recovery', recoverySeed },
        );
        const prepared = await boundary.prepare.mock.results[0]?.value;
        const finalize = boundary.finalize.mock.calls[0]?.[0];
        const confirm = boundary.confirm.mock.calls[0]?.[0];
        const unlock = boundary.unlock.mock.calls[0];
        if (
          prepared === undefined ||
          finalize === undefined ||
          confirm === undefined ||
          unlock === undefined ||
          prepared.intent.purpose === 'trusted' ||
          finalize.purpose === 'trusted'
        )
          throw new Error('Expected recovery-root enrollment');
        const transcript: EnrollmentTranscriptSnapshot = {
          ...prepared.intent,
          deviceEnvelope: finalize.deviceEnvelope,
        };
        const message = encodeEnrollmentFinalize(transcript);
        const recoverySignature = Uint8Array.from({ length: 64 }, (_, index) =>
          Number.parseInt(
            finalize.recoverySignature.slice(index * 2, index * 2 + 2),
            16,
          ),
        );
        expect(
          verifyRecoveryMessage(
            deriveRecoveryPublicKey(recoverySeed),
            message,
            recoverySignature,
          ),
        ).toBe(true);
        const publicJwk: unknown = JSON.parse(prepared.intent.signingPublicKey);
        const publicKey = await deviceSigningKey.importPublicJwk(publicJwk);
        const signatures: readonly (readonly [
          string,
          Uint8Array<ArrayBuffer>,
        ])[] = [
          [finalize.deviceSignature, message],
          [
            confirm.signature,
            encodeEnrollmentConfirmation(transcript, confirm.digest),
          ],
        ];
        for (const [signature, bytes] of signatures) {
          // Verify the actual public wire signatures through WebCrypto, not a mocked verifier.
          expect(enrollmentHexPattern.test(signature)).toBe(true);
          const raw = Uint8Array.from({ length: 64 }, (_, index) =>
            Number.parseInt(signature.slice(index * 2, index * 2 + 2), 16),
          );
          expect(
            await crypto.subtle.verify(
              { name: 'ECDSA', hash: 'SHA-256' },
              publicKey,
              raw,
              bytes,
            ),
          ).toBe(true);
        }
        expect(confirm.digest).toBe(await hashEnrollmentMessage(message));
        const [material, context] = unlock;
        if (material.localShare === undefined)
          throw new Error('Missing local split share');
        expect(material.localShare.extractable).toBe(false);
        const wrapKey = await vaultProtocol.deriveDeviceKey(
          material.localShare,
          serverShare,
          context,
        );
        const envelope: unknown = JSON.parse(finalize.deviceEnvelope);
        const restored = await vaultProtocol.unwrapVmk(
          envelope,
          wrapKey,
          context,
          vaultProtocolConstants.deviceWrapPurpose,
        );
        try {
          expect(restored).toEqual(vmk);
        } finally {
          restored.fill(0);
        }
        const network = JSON.stringify([
          boundary.prepare.mock.calls,
          boundary.finalize.mock.calls,
          boundary.confirm.mock.calls,
        ]);
        expect(network).not.toContain('07070707070707070707070707070707');
        expect(network).not.toContain('09090909090909090909090909090909');
        expect(network).not.toContain('recoverySeed');
        expect(boundary.lock).not.toHaveBeenCalled();
      } finally {
        vmk.fill(0);
        recoverySeed.fill(0);
      }
    },
  );

  it('uses exactly the device key prepared before scanning QR without a second prepare', async () => {
    const fixture = await createSignedTrustedFixture();
    try {
      await enrollVmk(
        'account',
        'workspace',
        {
          status: 'enrollment-required',
          vaultId: 'vault',
          keyId: 'key',
          deviceId: 'device',
        },
        fixture.vmk,
        () => {},
        {
          purpose: 'trusted',
          response: fixture.response,
          pending: {
            request: fixture.request,
            privateKey: fixture.privateKey,
            signingKeyPair: fixture.signing,
            prepared: {
              intent: fixture.request.intent,
              serverShare: btoa(String.fromCharCode(...serverShare)),
            },
          },
        },
      );
      expect(boundary.prepare).not.toHaveBeenCalled();
      expect(boundary.unlock.mock.calls[0]?.[0].signingKeyPair).toBe(
        fixture.signing,
      );
      expect(boundary.finalize.mock.calls[0]?.[0]).toMatchObject({
        purpose: 'trusted',
        delegationSignature: fixture.response.delegationSignature,
      });
      expect(boundary.confirm).toHaveBeenCalledOnce();
    } finally {
      fixture.vmk.fill(0);
    }
  });

  it('never initializes a local vault if the finalized proof is rejected', async () => {
    boundary.finalize.mockRejectedValue(new Error('Proof rejected'));
    const vmk = new Uint8Array(32);
    const recoverySeed = new Uint8Array(32);
    await expect(
      enrollVmk(
        'account',
        'workspace',
        { status: 'empty', vaultId: 'vault', keyId: 'key', deviceId: 'device' },
        vmk,
        () => {},
        { purpose: 'initial', recoverySeed },
      ),
    ).rejects.toThrow('Proof rejected');
    expect(boundary.unlock).not.toHaveBeenCalled();
    expect(boundary.confirm).not.toHaveBeenCalled();
  });

  it('locks and does not confirm after failed local initialization or rejected signed confirmation', async () => {
    for (const phase of ['unlock', 'confirm']) {
      boundary.unlock
        .mockReset()
        .mockImplementation(async (_material, _context, initialize) => {
          await initialize?.(() => true);
        });
      boundary.confirm.mockReset().mockResolvedValue(undefined);
      boundary.lock.mockClear();
      if (phase === 'unlock')
        boundary.unlock.mockRejectedValue(
          new Error('Local initialization rejected'),
        );
      else
        boundary.confirm.mockRejectedValue(new Error('Confirmation rejected'));
      await expect(
        enrollVmk(
          'account',
          'workspace',
          {
            status: 'empty',
            vaultId: 'vault',
            keyId: 'key',
            deviceId: 'device',
          },
          new Uint8Array(32),
          () => {},
          { purpose: 'initial', recoverySeed: new Uint8Array(32) },
        ),
      ).rejects.toThrow();
      expect(boundary.lock).toHaveBeenCalledOnce();
      expect(boundary.confirm).toHaveBeenCalledTimes(
        phase === 'unlock' ? 0 : 1,
      );
    }
  });
});
