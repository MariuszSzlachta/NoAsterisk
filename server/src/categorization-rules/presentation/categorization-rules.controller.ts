import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { CreateRuleHandler } from '@categorization-rules/application/commands/create-rule.handler';
import { UpdateRuleHandler } from '@categorization-rules/application/commands/update-rule.handler';
import { DeleteRuleHandler } from '@categorization-rules/application/commands/delete-rule.handler';
import { GetRulesHandler } from '@categorization-rules/application/queries/get-rules.handler';
import {
  createRuleSchema,
  CreateRuleDto,
  updateRuleSchema,
  UpdateRuleDto,
  ruleQuerySchema,
  RuleQueryDto,
} from '@categorization-rules/presentation/rule.dto';
import { CategorizationRuleResponseDto } from '@categorization-rules/application/dto/categorization-rule-response.dto';
import { ZodValidationPipe } from '@shared/presentation/zod-validation.pipe';
import { UuidParam } from '@shared/presentation/common.dto';
import { PagedResult } from '@shared/application/types/paged-query.types';

// TODO: Extract workspaceId from JWT token via @CurrentWorkspace() decorator
const TEMP_WORKSPACE_ID = 'ws-default';

@Controller('categorization-rules')
export class CategorizationRulesController {
  constructor(
    private readonly createHandler: CreateRuleHandler,
    private readonly updateHandler: UpdateRuleHandler,
    private readonly deleteHandler: DeleteRuleHandler,
    private readonly getRulesHandler: GetRulesHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createRuleSchema)) dto: CreateRuleDto,
  ): Promise<CategorizationRuleResponseDto> {
    return this.createHandler.execute({
      workspaceId: TEMP_WORKSPACE_ID,
      ...dto,
    });
  }

  @Get()
  async findAll(
    @Query(new ZodValidationPipe(ruleQuerySchema)) query: RuleQueryDto,
  ): Promise<PagedResult<CategorizationRuleResponseDto>> {
    return this.getRulesHandler.execute({
      workspaceId: TEMP_WORKSPACE_ID,
      page: query.page,
      limit: query.limit,
    });
  }

  @Put(':id')
  async update(
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
    @Body(new ZodValidationPipe(updateRuleSchema)) dto: UpdateRuleDto,
  ): Promise<CategorizationRuleResponseDto> {
    const result = await this.updateHandler.execute({
      workspaceId: TEMP_WORKSPACE_ID,
      id,
      ...dto,
    });
    if (!result) {
      throw new NotFoundException(`Categorization rule '${id}' not found`);
    }
    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', new ZodValidationPipe(UuidParam)) id: string,
  ): Promise<void> {
    const deleted = await this.deleteHandler.execute({
      workspaceId: TEMP_WORKSPACE_ID,
      id,
    });
    if (!deleted) {
      throw new NotFoundException(`Categorization rule '${id}' not found`);
    }
  }
}
