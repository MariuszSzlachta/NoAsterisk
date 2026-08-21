import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';
import {
  ProfileResponseDto,
  ProfileResponseMapper,
} from '@user-settings/application/mappers/profile-response.mapper';

export interface GetProfileQuery {
  userId: string;
}

@Injectable()
export class GetProfileHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
  ) {}

  async execute(query: GetProfileQuery): Promise<ProfileResponseDto> {
    const user = await this.userRepo.findById(query.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return ProfileResponseMapper.toDto(user);
  }
}
