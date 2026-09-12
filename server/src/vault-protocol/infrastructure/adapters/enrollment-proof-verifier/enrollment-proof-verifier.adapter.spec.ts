import { ed25519 } from '@noble/curves/ed25519.js';
import { createHash, sign } from 'node:crypto';
import type { EnrollmentTranscriptSnapshot } from '@vault-protocol/domain/value-objects/enrollment-transcript';
import { EnrollmentTranscript } from '@vault-protocol/domain/value-objects/enrollment-transcript';
import { EnrollmentProofVerifierAdapter } from '@vault-protocol/infrastructure/adapters/enrollment-proof-verifier';
import { VaultSignatureVerifierAdapter } from '@vault-protocol/infrastructure/adapters/vault-signature-verifier';
import { buildEnrollmentTranscript } from '@vault-protocol/testing/build-enrollment-transcript';
import { buildVaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture';

describe('complete enrollment proofs with real crypto', () => {
  it('should require both root and new-device proofs for recovery and reject envelope or purpose substitution', async () => {
    const keys = buildVaultSignatureFixture();
    try {
      const snapshot = {
        ...buildEnrollmentTranscript(),
        signingPublicKey: keys.devicePublicKey,
        recoveryPublicKey: keys.recoveryPublicKey,
      };
      const transcript = new EnrollmentTranscript(snapshot);
      const bytes = transcript.toFinalizeSigningBytes();
      const proof = {
        purpose: snapshot.purpose,
        deviceSignature: sign('sha256', bytes, {
          key: keys.devicePrivateKey,
          dsaEncoding: 'ieee-p1363',
        }).toString('hex'),
        recoverySignature: Buffer.from(
          ed25519.sign(bytes, keys.recoverySeed),
        ).toString('hex'),
      };
      const verifier = new EnrollmentProofVerifierAdapter(
        new VaultSignatureVerifierAdapter(),
      );
      await expect(verifier.verify(transcript, proof)).resolves.toBe(true);
      await expect(
        verifier.verify(transcript, {
          ...proof,
          deviceSignature: '0'.repeat(128),
        }),
      ).resolves.toBe(false);
      await expect(
        verifier.verify(transcript, {
          ...proof,
          recoverySignature: '0'.repeat(128),
        }),
      ).resolves.toBe(false);
      await expect(
        verifier.verify(
          new EnrollmentTranscript({
            ...snapshot,
            deviceEnvelope: '{"changed":true}',
          }),
          proof,
        ),
      ).resolves.toBe(false);
      await expect(
        verifier.verify(
          new EnrollmentTranscript({ ...snapshot, purpose: 'initial' }),
          proof,
        ),
      ).resolves.toBe(false);
    } finally {
      keys.recoverySeed.fill(0);
    }
  });

  it('should bind a real approver delegation digest and the new-device full signature', async () => {
    const newDevice = buildVaultSignatureFixture();
    const approver = buildVaultSignatureFixture();
    try {
      const snapshot: EnrollmentTranscriptSnapshot = {
        ...buildEnrollmentTranscript(),
        purpose: 'trusted',
        signingPublicKey: newDevice.devicePublicKey,
        newEphemeralPublicKey: newDevice.devicePublicKey,
        oldDeviceId: 'approver',
        delegationDigest: '0'.repeat(64),
      };
      const delegation = new EnrollmentTranscript(
        snapshot,
      ).toDelegationSigningBytes();
      const bound = {
        ...snapshot,
        delegationDigest: createHash('sha256').update(delegation).digest('hex'),
      };
      const transcript = new EnrollmentTranscript(bound);
      const proof = {
        purpose: snapshot.purpose,
        approverSigningPublicKey: approver.devicePublicKey,
        delegationSignature: sign('sha256', delegation, {
          key: approver.devicePrivateKey,
          dsaEncoding: 'ieee-p1363',
        }).toString('hex'),
        deviceSignature: sign('sha256', transcript.toFinalizeSigningBytes(), {
          key: newDevice.devicePrivateKey,
          dsaEncoding: 'ieee-p1363',
        }).toString('hex'),
      };
      const verifier = new EnrollmentProofVerifierAdapter(
        new VaultSignatureVerifierAdapter(),
      );
      await expect(verifier.verify(transcript, proof)).resolves.toBe(true);
      await expect(
        verifier.verify(transcript, {
          ...proof,
          approverSigningPublicKey: newDevice.devicePublicKey,
        }),
      ).resolves.toBe(false);
      const wrongDigest = new EnrollmentTranscript({
        ...bound,
        delegationDigest: 'f'.repeat(64),
      });
      await expect(
        verifier.verify(wrongDigest, {
          ...proof,
          deviceSignature: sign(
            'sha256',
            wrongDigest.toFinalizeSigningBytes(),
            { key: newDevice.devicePrivateKey, dsaEncoding: 'ieee-p1363' },
          ).toString('hex'),
        }),
      ).resolves.toBe(false);
      const replayContext = { ...bound, challenge: 'B'.repeat(43) };
      const replayDelegation = new EnrollmentTranscript(
        replayContext,
      ).toDelegationSigningBytes();
      const replay = new EnrollmentTranscript({
        ...replayContext,
        delegationDigest: createHash('sha256')
          .update(replayDelegation)
          .digest('hex'),
      });
      await expect(
        verifier.verify(replay, {
          ...proof,
          deviceSignature: sign('sha256', replay.toFinalizeSigningBytes(), {
            key: newDevice.devicePrivateKey,
            dsaEncoding: 'ieee-p1363',
          }).toString('hex'),
        }),
      ).resolves.toBe(false);
    } finally {
      newDevice.recoverySeed.fill(0);
      approver.recoverySeed.fill(0);
    }
  });
});
