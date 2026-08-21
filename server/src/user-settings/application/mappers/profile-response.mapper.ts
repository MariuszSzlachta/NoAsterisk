import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';

export interface ProfileResponseDto {
  id: string;
  email: string;
  displayName: string | undefined;
  role: 'Superuser' | 'Member';
  workspaceId: string;
  createdAt: string;
}

const ROLE_MAP: Record<UserRole, ProfileResponseDto['role']> = {
  [UserRole.Superuser]: 'Superuser',
  [UserRole.Member]: 'Member',
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
    };
  }
}
