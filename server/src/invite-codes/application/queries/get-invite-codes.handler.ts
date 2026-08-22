import { Injectable, Inject } from '@nestjs/common';
import {
  INVITE_CODE_REPOSITORY,
  InviteCodeRepository,
} from '@invite-codes/domain/ports/invite-code.repository';
import { InviteCodeResponseDto } from '@invite-codes/application/dto/invite-code-response.dto';
import { InviteCodeResponseMapper } from '@invite-codes/application/mappers/invite-code-response.mapper';

@Injectable()
export class GetInviteCodesHandler {
  constructor(
    @Inject(INVITE_CODE_REPOSITORY)
    private readonly repo: InviteCodeRepository,
  ) {}

  async execute(): Promise<ReadonlyArray<InviteCodeResponseDto>> {
    const codes = await this.repo.findAll();
    return InviteCodeResponseMapper.toDtoList(codes);
  }
}
