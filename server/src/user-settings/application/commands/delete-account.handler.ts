import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '@auth/domain/ports/password-hasher.port';
import { AccountDeletionRepository } from '@user-settings/application/ports/account-deletion.repository';
import { ACCOUNT_DELETION_REPOSITORY } from '@user-settings/application/ports/account-deletion-token';
import { DomainError } from '@budget/domain';

export interface DeleteAccountCommand {
  userId: string;
  workspaceId: string;
  password: string;
}

export interface DeleteAccountResult {
  success: true;
}

@Injectable()
export class DeleteAccountHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(ACCOUNT_DELETION_REPOSITORY)
    private readonly accountDeletionRepo: AccountDeletionRepository,
  ) {}

  async execute(command: DeleteAccountCommand): Promise<DeleteAccountResult> {
    const user = await this.userRepo.findById(command.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.workspaceId !== command.workspaceId) {
      throw new DomainError('Workspace mismatch');
    }

    const isValid = await this.hasher.compare(
      command.password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new DomainError('Password is incorrect');
    }

    await this.accountDeletionRepo.deleteUserOwnedData(
      command.userId,
      command.workspaceId,
    );

    return { success: true };
  }
}
