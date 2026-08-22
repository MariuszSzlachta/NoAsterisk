import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DomainError } from '@budget/domain';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';

export interface LogoutCommand {
  userId: string;
}

export interface LogoutResult {
  success: true;
}

@Injectable()
export class LogoutHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<LogoutResult> {
    if (!command.userId) {
      throw new DomainError('User ID is required for logout');
    }

    const user = await this.userRepo.findById(command.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = user.incrementTokenVersion();
    await this.userRepo.save(updatedUser);

    return { success: true };
  }
}
