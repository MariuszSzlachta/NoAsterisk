import { Injectable, Inject } from '@nestjs/common';
import { DomainError } from '@budget/domain';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';
import { UserRole } from '@auth/domain/user-role.enum';

export interface BlockUserCommand {
  targetUserId: string;
  requesterId: string;
}

@Injectable()
export class BlockUserHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  /**
   * Toggles block state: Member → Blocked, Blocked → Member.
   * Blocking increments tokenVersion to immediately invalidate active sessions.
   * Superusers cannot be blocked (entity invariant).
   */
  async execute(command: BlockUserCommand): Promise<void> {
    if (command.targetUserId === command.requesterId) {
      throw new DomainError('Cannot block your own account');
    }

    const user = await this.userRepo.findById(command.targetUserId);
    if (!user) {
      throw new DomainError('User not found');
    }

    if (user.role === UserRole.Blocked) {
      const unblocked = user.unblock();
      await this.userRepo.save(unblocked);
    } else {
      const blocked = user.block();
      await this.userRepo.save(blocked);
    }
  }
}
