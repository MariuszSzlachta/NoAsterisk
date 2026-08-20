import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateCategoryHandler } from '@categories/application/commands/create-category.handler';
import { UpdateCategoryHandler } from '@categories/application/commands/update-category.handler';
import { DeleteCategoryHandler } from '@categories/application/commands/delete-category.handler';
import { GetCategoriesHandler } from '@categories/application/queries/get-categories.handler';
import { CategoryResponseDto } from '@categories/application/dto/category-response.dto';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@categories/presentation/category.dto';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { UuidParam } from '@shared/presentation/common.dto';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@auth/presentation/decorators/current-user.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly createHandler: CreateCategoryHandler,
    private readonly updateHandler: UpdateCategoryHandler,
    private readonly deleteHandler: DeleteCategoryHandler,
    private readonly getHandler: GetCategoriesHandler,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(CreateCategoryDto)) dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.createHandler.execute({
      workspaceId: user.workspaceId,
      name: dto.name,
    });
  }

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CategoryResponseDto[]> {
    return this.getHandler.execute(user.workspaceId);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
    @Body(new ZodValidationPipe(UpdateCategoryDto)) dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.updateHandler.execute({
      id,
      workspaceId: user.workspaceId,
      ...dto,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
  ): Promise<void> {
    return this.deleteHandler.execute({ id, workspaceId: user.workspaceId });
  }
}
