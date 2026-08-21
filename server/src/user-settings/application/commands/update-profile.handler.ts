import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';

export interface UpdateProfileCommand {
  userId: string;
  displayName: string;
}

export interface UpdateProfileResult {
  displayName: string | undefined;
}

@Injectable()
export class UpdateProfileHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<UpdateProfileResult> {
    const user = await this.userRepo.findById(command.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = user.updateDisplayName(command.displayName);
    await this.userRepo.save(updatedUser);

    return { displayName: updatedUser.displayName };
  }
}
