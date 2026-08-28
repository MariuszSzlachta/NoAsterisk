export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly role: 'Superuser' | 'Member';
  readonly workspaceId: string;
}
