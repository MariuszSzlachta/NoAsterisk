import type { EnrollmentTranscript } from '@vault-protocol/domain/value-objects/enrollment-transcript';

export type EnrollmentAuthorizationProof =
  | {
      readonly purpose: 'initial' | 'recovery';
      readonly deviceSignature: string;
      readonly recoverySignature: string;
    }
  | {
      readonly purpose: 'trusted';
      readonly deviceSignature: string;
      readonly delegationSignature: string;
      /** Loaded from scoped current authority, never trusted from request input. */
      readonly approverSigningPublicKey: string;
    };

/** Crypto only. The repository must atomically recheck current authority/expiry. */
export interface EnrollmentProofVerifierPort {
  verify(
    transcript: EnrollmentTranscript,
    proof: EnrollmentAuthorizationProof,
  ): Promise<boolean>;
}
