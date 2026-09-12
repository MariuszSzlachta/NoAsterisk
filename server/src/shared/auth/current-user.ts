export interface CurrentUserPayload {
  readonly userId: string;
  readonly workspaceId: string;
  readonly role: string;
  readonly authTime?: number;
  readonly amr?: 'password' | 'webauthn';
  readonly vaultUnlockGrant?: string;
}
