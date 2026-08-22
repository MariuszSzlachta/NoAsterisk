import {
  Controller,
  Get,
  Patch,
  Delete,
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
import {
  GetAllUsersHandler,
  AdminUserDto,
} from '@user-settings/application/queries/get-all-users.handler';
import { BlockUserHandler } from '@user-settings/application/commands/block-user.handler';
import { AdminDeleteUserHandler } from '@user-settings/application/commands/admin-delete-user.handler';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { UuidParam } from '@shared/presentation/common.dto';

@Controller('admin/users')
@Roles(UserRole.Superuser)
export class AdminUsersController {
  constructor(
    private readonly getAllUsersHandler: GetAllUsersHandler,
    private readonly blockUserHandler: BlockUserHandler,
    private readonly adminDeleteUserHandler: AdminDeleteUserHandler,
  ) {}

  @Get()
  async getAll(): Promise<ReadonlyArray<AdminUserDto>> {
    return this.getAllUsersHandler.execute();
  }

  @Patch(':id/block')
  @HttpCode(HttpStatus.NO_CONTENT)
  async toggleBlock(
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    await this.blockUserHandler.execute({
      targetUserId: id,
      requesterId: user.userId,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    await this.adminDeleteUserHandler.execute({
      targetUserId: id,
      requesterId: user.userId,
    });
  }
}
