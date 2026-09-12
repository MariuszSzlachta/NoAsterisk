import type {
  EnrollmentTranscriptSnapshot,
  SignedEnrollmentPreparation,
} from '#shared/adapters/vault-protocol/enrollment-transcript';
import type {
  TrustedDeviceRequest,
  TrustedDeviceResponse,
} from '#shared/adapters/vault-protocol/trusted-device-enrollment';

export interface SignedTrustedRequest {
  readonly kind: 'budgetflow/trusted-device-qr-v2';
  readonly formatVersion: 2;
  readonly intent: Extract<
    EnrollmentTranscriptSnapshot,
    { purpose: 'trusted' }
  >;
  readonly transferRequest: TrustedDeviceRequest;
}
export interface SignedTrustedResponse {
  readonly kind: 'budgetflow/trusted-device-qr-v2';
  readonly formatVersion: 2;
  readonly intent: Extract<
    EnrollmentTranscriptSnapshot,
    { purpose: 'trusted' }
  >;
  readonly transferResponse: TrustedDeviceResponse;
  readonly delegationSignature: string;
}
export interface SignedTrustedPending {
  readonly request: SignedTrustedRequest;
  readonly privateKey: CryptoKey;
  readonly signingKeyPair: CryptoKeyPair;
  readonly prepared: SignedEnrollmentPreparation;
}
