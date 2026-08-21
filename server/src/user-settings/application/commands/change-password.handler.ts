import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '@auth/domain/ports/password-hasher.port';
import { DomainError } from '@budget/domain';

export interface ChangePasswordCommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResult {
  success: true;
}

@Injectable()
export class ChangePasswordHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<ChangePasswordResult> {
    const user = await this.userRepo.findById(command.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await this.hasher.compare(
      command.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new DomainError('Current password is incorrect');
    }

    const isSameAsNew = await this.hasher.compare(
      command.newPassword,
      user.passwordHash,
    );
    if (isSameAsNew) {
      throw new DomainError('New password must differ from current password');
    }

    const newHash = await this.hasher.hash(command.newPassword);
    const updatedUser = user.changePassword(newHash);
    await this.userRepo.save(updatedUser);

    return { success: true };
  }
}
