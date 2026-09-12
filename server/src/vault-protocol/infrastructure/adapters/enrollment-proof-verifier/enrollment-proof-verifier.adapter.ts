import { createHash, createPublicKey } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { VAULT_SIGNATURE_VERIFIER } from '@vault-protocol/domain/ports/vault-signature-verifier';
import type {
  EnrollmentAuthorizationProof,
  EnrollmentProofVerifierPort,
} from '@vault-protocol/domain/ports/enrollment-proof-verifier';
import type { VaultSignatureVerifierPort } from '@vault-protocol/domain/ports/vault-signature-verifier';
import type { EnrollmentTranscript } from '@vault-protocol/domain/value-objects/enrollment-transcript';
import { publicEphemeralKeySchema } from '@vault-protocol/infrastructure/adapters/public-ephemeral-key-schema';

@Injectable()
export class EnrollmentProofVerifierAdapter implements EnrollmentProofVerifierPort {
  constructor(
    @Inject(VAULT_SIGNATURE_VERIFIER)
    private readonly signatures: VaultSignatureVerifierPort,
  ) {}

  async verify(
    transcript: EnrollmentTranscript,
    proof: EnrollmentAuthorizationProof,
  ): Promise<boolean> {
    try {
      const snapshot = transcript.snapshot;
      if (snapshot.purpose !== proof.purpose) return false;
      const finalizeBytes = transcript.toFinalizeSigningBytes();
      if (
        !(await this.signatures.verifyDevice(
          snapshot.signingPublicKey,
          finalizeBytes,
          proof.deviceSignature,
        ))
      )
        return false;

      if (snapshot.purpose !== 'trusted' && proof.purpose !== 'trusted')
        return await this.signatures.verifyRecovery(
          snapshot.recoveryPublicKey,
          finalizeBytes,
          proof.recoverySignature,
        );
      if (snapshot.purpose !== 'trusted' || proof.purpose !== 'trusted')
        return false;

      const rawEphemeralKey: unknown = JSON.parse(
        snapshot.newEphemeralPublicKey,
      );
      const ephemeralKey = publicEphemeralKeySchema.safeParse(rawEphemeralKey);
      if (!ephemeralKey.success) return false;
      createPublicKey({ key: ephemeralKey.data, format: 'jwk' });
      const delegationBytes = transcript.toDelegationSigningBytes();
      if (
        createHash('sha256').update(delegationBytes).digest('hex') !==
        snapshot.delegationDigest
      )
        return false;
      return await this.signatures.verifyDevice(
        proof.approverSigningPublicKey,
        delegationBytes,
        proof.delegationSignature,
      );
    } catch {
      return false;
    }
  }
}
