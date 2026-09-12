interface EnrollmentTranscriptContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly challenge: string;
  readonly createdAt: number;
  readonly expiresAt: number;
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
        readonly delegationDigest: string;
      }
  );
export type SignedEnrollmentInput =
  | Omit<
      Extract<
        EnrollmentTranscriptSnapshot,
        { purpose: 'initial' | 'recovery' }
      >,
      | 'challenge'
      | 'createdAt'
      | 'expiresAt'
      | 'deviceEnvelope'
      | 'passkeyEnvelope'
      | 'accountId'
      | 'workspaceId'
    >
  | Omit<
      Extract<EnrollmentTranscriptSnapshot, { purpose: 'trusted' }>,
      | 'challenge'
      | 'createdAt'
      | 'expiresAt'
      | 'deviceEnvelope'
      | 'passkeyEnvelope'
      | 'delegationDigest'
      | 'accountId'
      | 'workspaceId'
    >;
export interface SignedEnrollmentPreparation {
  readonly intent: EnrollmentTranscriptSnapshot;
  readonly serverShare: string;
}
interface FinalizationContext {
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly challenge: string;
  readonly deviceEnvelope: string;
  readonly passkeyEnvelope?: string;
  readonly deviceSignature: string;
}
export type SignedEnrollmentFinalization = FinalizationContext &
  (
    | {
        readonly purpose: 'initial' | 'recovery';
        readonly recoverySignature: string;
      }
    | {
        readonly purpose: 'trusted';
        readonly delegationSignature: string;
        readonly delegationDigest: string;
      }
  );
export interface SignedEnrollmentConfirmation {
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly challenge: string;
  readonly digest: string;
  readonly signature: string;
}
