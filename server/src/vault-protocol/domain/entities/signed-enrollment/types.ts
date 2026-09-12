import type {
  EnrollmentTranscriptSnapshot,
  EnrollmentTranscriptScope,
} from '@vault-protocol/domain/value-objects/enrollment-transcript';

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
    >
  | Omit<
      Extract<EnrollmentTranscriptSnapshot, { purpose: 'trusted' }>,
      | 'challenge'
      | 'createdAt'
      | 'expiresAt'
      | 'deviceEnvelope'
      | 'passkeyEnvelope'
      | 'delegationDigest'
    >;

export type SignedEnrollmentState =
  | { readonly kind: 'pending' }
  | { readonly kind: 'finalized'; readonly digest: string }
  | { readonly kind: 'active'; readonly digest: string };

export interface SignedEnrollmentSnapshot {
  readonly intent: EnrollmentTranscriptSnapshot;
  readonly state: SignedEnrollmentState;
}

export interface SignedEnrollmentDeviceBinding extends EnrollmentTranscriptScope {
  readonly status: string;
  readonly isRevoked: boolean;
}

export type SignedEnrollmentAuthority =
  | { readonly kind: 'empty' }
  | {
      readonly kind: 'existing';
      readonly vaultId: string;
      readonly keyId: string;
      readonly protocolVersion: string;
      readonly cryptoSuite: string;
      readonly recoveryPublicKey: string | undefined;
      readonly approver:
        | {
            readonly deviceId: string;
            readonly signingPublicKey: string;
            readonly isRevoked: boolean;
            readonly status: string;
          }
        | undefined;
    };

export interface SignedEnrollmentEnvelopes extends EnrollmentTranscriptScope {
  readonly challenge: string;
  readonly deviceEnvelope: string;
  readonly passkeyEnvelope?: string;
}

export type SignedEnrollmentFinalization = SignedEnrollmentEnvelopes & {
  readonly authDeadline: number;
  readonly deviceSignature: string;
} & (
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

export interface SignedEnrollmentConfirmation extends EnrollmentTranscriptScope {
  readonly challenge: string;
  readonly digest: string;
  readonly signature: string;
  readonly authDeadline: number;
}
