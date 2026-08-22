import { Injectable, Inject } from '@nestjs/common';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';

export interface AdminUserDto {
  readonly id: string;
  readonly email: string;
  readonly role: 'Superuser' | 'Member' | 'Blocked';
  readonly workspaceId: string;
  readonly createdAt: string;
  readonly displayName: string | null;
}

const ROLE_MAP: Record<UserRole, AdminUserDto['role']> = {
  [UserRole.Superuser]: 'Superuser',
  [UserRole.Member]: 'Member',
  [UserRole.Blocked]: 'Blocked',
};

@Injectable()
export class GetAllUsersHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  async execute(): Promise<ReadonlyArray<AdminUserDto>> {
    const users = await this.userRepo.findAll();
    return users.map((user) => this.toDto(user));
  }

  private toDto(user: User): AdminUserDto {
    return {
      id: user.id,
      email: user.email,
      role: ROLE_MAP[user.role],
      workspaceId: user.workspaceId,
      createdAt: user.createdAt.toISOString(),
      displayName: user.displayName ?? null,
    };
  }
}
