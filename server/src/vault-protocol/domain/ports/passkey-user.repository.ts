export const PASSKEY_USER_REPOSITORY = Symbol('PASSKEY_USER_REPOSITORY');

export type PasskeyUserRole = 'Superuser' | 'Member' | 'Blocked';

export interface PasskeyUser {
  readonly id: string;
  readonly email: string;
  readonly role: PasskeyUserRole;
  readonly workspaceId: string;
  readonly tokenVersion: number;
  readonly displayName?: string;
}

export interface PasskeyUserRepository {
  findById(id: string): Promise<PasskeyUser | undefined>;
  findByEmail(email: string): Promise<PasskeyUser | undefined>;
}
