import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';
import { UserPreferences } from '@auth/domain/user-preferences.vo';

export interface ProfileResponseDto {
  id: string;
  email: string;
  displayName: string | undefined;
  role: 'Superuser' | 'Member' | 'Blocked';
  workspaceId: string;
  createdAt: string;
  preferences: UserPreferences;
}

const ROLE_MAP: Record<UserRole, ProfileResponseDto['role']> = {
  [UserRole.Superuser]: 'Superuser',
  [UserRole.Member]: 'Member',
  [UserRole.Blocked]: 'Blocked',
};

export class ProfileResponseMapper {
  static toDto(user: User): ProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: ROLE_MAP[user.role],
      workspaceId: user.workspaceId,
      createdAt: user.createdAt.toISOString(),
      preferences: user.preferences,
    };
  }
}
