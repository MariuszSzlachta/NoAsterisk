import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@auth/presentation/decorators/current-user.decorator';
import { UserRole } from '@auth/domain/user-role.enum';
import { GenerateCodeHandler } from '@invite-codes/application/commands/generate-code.handler';
import { DeleteCodeHandler } from '@invite-codes/application/commands/delete-code.handler';
import { GetInviteCodesHandler } from '@invite-codes/application/queries/get-invite-codes.handler';
import { InviteCodeResponseDto } from '@invite-codes/application/dto/invite-code-response.dto';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { UuidParam } from '@shared/presentation/common.dto';
import {
  generateCodeSchema,
  GenerateCodeDto,
} from '@invite-codes/presentation/dto/generate-code.dto';

@Controller('admin/invite-codes')
@Roles(UserRole.Superuser)
export class InviteCodesController {
  constructor(
    private readonly generateHandler: GenerateCodeHandler,
    private readonly deleteHandler: DeleteCodeHandler,
    private readonly getCodesHandler: GetInviteCodesHandler,
  ) {}

  @Get()
  async getAll(): Promise<ReadonlyArray<InviteCodeResponseDto>> {
    return this.getCodesHandler.execute();
  }

  @Post()
  async generate(
    @Body(new ZodValidationPipe(generateCodeSchema)) dto: GenerateCodeDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<InviteCodeResponseDto> {
    return this.generateHandler.execute({
      createdBy: user.userId,
      expiresAt: dto.expiresAt,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
  ): Promise<void> {
    await this.deleteHandler.execute({ id });
  }
}
