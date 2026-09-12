export interface EnrollmentTranscriptScope {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
}

interface EnrollmentTranscriptContext extends EnrollmentTranscriptScope {
  readonly challenge: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  /** Exact JWK JSON bytes; native public-key validity is checked by the adapter. */
  readonly signingPublicKey: string;
  readonly deviceEnvelope: string;
  readonly passkeyEnvelope?: string;
}

export type EnrollmentTranscriptSnapshot = EnrollmentTranscriptContext &
  (
    | {
        readonly purpose: 'initial' | 'recovery';
        readonly recoveryPublicKey: string;
      }
    | {
        readonly purpose: 'trusted';
        readonly oldDeviceId: string;
        readonly newEphemeralPublicKey: string;
        /** SHA-256 of exact canonical delegation bytes, not a client assertion. */
        readonly delegationDigest: string;
      }
  );
