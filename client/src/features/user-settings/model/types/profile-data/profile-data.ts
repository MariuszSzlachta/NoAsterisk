import type { UserRole } from '#features/user-settings/model/types/user-role';

export interface ProfileData {
  readonly id: string;
  readonly email: string;
  readonly displayName: string | undefined;
  readonly role: UserRole;
  readonly workspaceId: string;
  readonly createdAt: string;
}
