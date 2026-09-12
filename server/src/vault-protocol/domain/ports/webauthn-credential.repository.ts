export const WEBAUTHN_CREDENTIAL_REPOSITORY = Symbol(
  'WEBAUTHN_CREDENTIAL_REPOSITORY',
);

// ARCH-EXCEPTION: global-scope — credentials are account-scoped by userId;
// the user foreign key owns the workspace boundary and no credential is
// addressable without the authenticated account. Accepted permanently for
// account-bound WebAuthn credentials.

export interface StoredWebauthnCredential {
  readonly id: string;
  readonly userId: string;
  readonly credentialId: string;
  readonly publicKey: Uint8Array<ArrayBuffer>;
  readonly counter: number;
  readonly transports: ReadonlyArray<string>;
  readonly supportsPrf: boolean;
  readonly revokedAt?: Date;
}

export interface CreateWebauthnCredential {
  readonly userId: string;
  readonly credentialId: string;
  readonly publicKey: Uint8Array<ArrayBuffer>;
  readonly counter: number;
  readonly transports: ReadonlyArray<string>;
  readonly supportsPrf: boolean;
}

export interface WebauthnCredentialRepository {
  create(input: CreateWebauthnCredential): Promise<void>;
  findActiveByCredentialId(
    credentialId: string,
  ): Promise<StoredWebauthnCredential | undefined>;
  listActiveByUserId(
    userId: string,
  ): Promise<ReadonlyArray<StoredWebauthnCredential>>;
  updateCounter(credentialId: string, counter: number): Promise<void>;
  revoke(userId: string, credentialId: string): Promise<void>;
}
