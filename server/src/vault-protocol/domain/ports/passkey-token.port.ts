export const PASSKEY_TOKEN_PORT = Symbol('PASSKEY_TOKEN_PORT');

export interface PasskeyTokenPayload {
  readonly sub: string;
  readonly workspaceId: string;
  readonly role: string;
  readonly tokenVersion?: number;
  readonly authTime?: number;
  readonly amr?: 'password' | 'webauthn';
  readonly vaultUnlockGrant?: string;
}

export interface PasskeyTokenPort {
  sign(payload: PasskeyTokenPayload): string;
  signRefresh(payload: PasskeyTokenPayload): string;
}
