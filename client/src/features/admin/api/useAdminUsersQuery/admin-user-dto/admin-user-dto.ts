export interface AdminUserDto {
  readonly id: string;
  readonly email: string;
  readonly role: 'Superuser' | 'Member' | 'Blocked';
  readonly createdAt: string;
  readonly hasVault: boolean;
}
