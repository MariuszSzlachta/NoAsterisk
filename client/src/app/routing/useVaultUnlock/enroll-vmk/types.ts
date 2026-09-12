import type {
  SignedTrustedPending,
  SignedTrustedResponse,
} from '#shared/adapters/vault-protocol/signed-trusted-enrollment';

export interface EnrollmentBootstrap {
  readonly status: 'empty' | 'enrollment-required' | 'available';
  readonly vaultId?: string;
  readonly keyId?: string;
  readonly deviceId: string;
  readonly recoveryPublicKey?: string;
}
export type EnrollmentAuthorization =
  | {
      readonly purpose: 'initial' | 'recovery';
      readonly recoverySeed: Uint8Array;
    }
  | {
      readonly purpose: 'trusted';
      readonly pending: SignedTrustedPending;
      readonly response: SignedTrustedResponse;
    };
