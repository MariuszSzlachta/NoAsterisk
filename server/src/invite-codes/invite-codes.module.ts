import { Module } from '@nestjs/common';
import { InviteCodesController } from '@invite-codes/presentation/invite-codes.controller';
import { GenerateCodeHandler } from '@invite-codes/application/commands/generate-code.handler';
import { DeleteCodeHandler } from '@invite-codes/application/commands/delete-code.handler';
import { RedeemCodeHandler } from '@invite-codes/application/commands/redeem-code.handler';
import { GetInviteCodesHandler } from '@invite-codes/application/queries/get-invite-codes.handler';
import { INVITE_CODE_REPOSITORY } from '@invite-codes/domain/ports/invite-code.repository';
import { PostgresInviteCodeRepository } from '@invite-codes/infrastructure/postgres-invite-code.repository';
import { InMemoryInviteCodeRepository } from '@invite-codes/infrastructure/in-memory-invite-code.repository';
import { createRepositoryProvider } from '@shared/infrastructure/database/persistence.provider';

@Module({
  controllers: [InviteCodesController],
  providers: [
    GenerateCodeHandler,
    DeleteCodeHandler,
    RedeemCodeHandler,
    GetInviteCodesHandler,
    createRepositoryProvider(
      INVITE_CODE_REPOSITORY,
      PostgresInviteCodeRepository,
      InMemoryInviteCodeRepository,
    ),
  ],
  exports: [RedeemCodeHandler, INVITE_CODE_REPOSITORY],
})
export class InviteCodesModule {}
