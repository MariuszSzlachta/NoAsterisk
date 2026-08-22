import { Injectable, Inject } from '@nestjs/common';
import {
  INVITE_CODE_REPOSITORY,
  InviteCodeRepository,
} from '@invite-codes/domain/ports/invite-code.repository';
import { InviteCode } from '@invite-codes/domain/invite-code.entity';
import { InviteCodeResponseDto } from '@invite-codes/application/dto/invite-code-response.dto';
import { InviteCodeResponseMapper } from '@invite-codes/application/mappers/invite-code-response.mapper';

export interface GenerateCodeCommand {
  createdBy: string;
  expiresAt?: string;
}

@Injectable()
export class GenerateCodeHandler {
  constructor(
    @Inject(INVITE_CODE_REPOSITORY)
    private readonly repo: InviteCodeRepository,
  ) {}

  async execute(command: GenerateCodeCommand): Promise<InviteCodeResponseDto> {
    const expiresAt = command.expiresAt
      ? new Date(command.expiresAt)
      : undefined;

    const code = InviteCode.create({
      createdBy: command.createdBy,
      expiresAt,
    });

    await this.repo.save(code);

    return InviteCodeResponseMapper.toDto(code);
  }
}
