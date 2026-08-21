import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';
import { UserPreferences } from '@auth/domain/user-preferences.vo';

export interface UpdatePreferencesCommand {
  userId: string;
  preferences: Partial<UserPreferences>;
}

export interface UpdatePreferencesResult {
  preferences: UserPreferences;
}

@Injectable()
export class UpdatePreferencesHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  async execute(
    command: UpdatePreferencesCommand,
  ): Promise<UpdatePreferencesResult> {
    const user = await this.userRepo.findById(command.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = user.updatePreferences(command.preferences);
    await this.userRepo.save(updatedUser);

    return { preferences: updatedUser.preferences };
  }
}
