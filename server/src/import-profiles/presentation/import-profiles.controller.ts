import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { CreateImportProfileHandler } from '@import-profiles/application/commands/create-import-profile.handler';
import { UpdateImportProfileHandler } from '@import-profiles/application/commands/update-import-profile.handler';
import { DeleteImportProfileHandler } from '@import-profiles/application/commands/delete-import-profile.handler';
import { GetImportProfilesHandler } from '@import-profiles/application/queries/get-import-profiles.handler';
import { GetImportProfileByIdHandler } from '@import-profiles/application/queries/get-import-profile-by-id.handler';
import { DetectImportProfileHandler } from '@import-profiles/application/queries/detect-import-profile.handler';
import {
  createImportProfileSchema,
  CreateImportProfileDto,
  updateImportProfileSchema,
  UpdateImportProfileDto,
  detectProfileSchema,
  DetectProfileDto,
} from '@import-profiles/presentation/import-profile.dto';
import { ImportProfileResponseDto } from '@import-profiles/application/dto/import-profile-response.dto';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { UuidParam } from '@shared/presentation/common.dto';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@auth/presentation/decorators/current-user.decorator';

@Controller('import-profiles')
export class ImportProfilesController {
  constructor(
    private readonly createHandler: CreateImportProfileHandler,
    private readonly updateHandler: UpdateImportProfileHandler,
    private readonly deleteHandler: DeleteImportProfileHandler,
    private readonly getProfilesHandler: GetImportProfilesHandler,
    private readonly getByIdHandler: GetImportProfileByIdHandler,
    private readonly detectHandler: DetectImportProfileHandler,
  ) {}

  @Post('detect')
  @HttpCode(HttpStatus.OK)
  async detect(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(detectProfileSchema)) dto: DetectProfileDto,
  ): Promise<ImportProfileResponseDto> {
    const result = await this.detectHandler.execute({
      workspaceId: user.workspaceId,
      headers: dto.headers,
    });
    if (!result) {
      throw new NotFoundException('No matching import profile found');
    }
    return result;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(createImportProfileSchema))
    dto: CreateImportProfileDto,
  ): Promise<ImportProfileResponseDto> {
    return this.createHandler.execute({
      workspaceId: user.workspaceId,
      ...dto,
    });
  }

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ImportProfileResponseDto[]> {
    return this.getProfilesHandler.execute(user.workspaceId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
  ): Promise<ImportProfileResponseDto> {
    const result = await this.getByIdHandler.execute(user.workspaceId, id);
    if (!result) {
      throw new NotFoundException(`Import profile '${id}' not found`);
    }
    return result;
  }

  @Put(':id')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
    @Body(new ZodValidationPipe(updateImportProfileSchema))
    dto: UpdateImportProfileDto,
  ): Promise<ImportProfileResponseDto> {
    const result = await this.updateHandler.execute({
      workspaceId: user.workspaceId,
      id,
      ...dto,
    });
    if (!result) {
      throw new NotFoundException(`Import profile '${id}' not found`);
    }
    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
  ): Promise<void> {
    const deleted = await this.deleteHandler.execute({
      workspaceId: user.workspaceId,
      id,
    });
    if (!deleted) {
      throw new NotFoundException(`Import profile '${id}' not found`);
    }
  }
}
