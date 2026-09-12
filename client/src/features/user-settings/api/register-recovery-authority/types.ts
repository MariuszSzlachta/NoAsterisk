import type { VaultSessionContext } from '#shared/adapters/persistence/session/assert-vault-session-current/types';

export interface RecoveryAuthorityRegistration {
  readonly context: VaultSessionContext;
  readonly recoverySeed: Uint8Array;
  readonly signingKey: CryptoKey;
  readonly signingPublicKey: CryptoKey;
  readonly assertCurrent: () => void;
}
