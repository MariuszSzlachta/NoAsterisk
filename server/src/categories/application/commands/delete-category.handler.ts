import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
} from '@categories/application/ports/category.repository';
import {
  CATEGORY_USAGE_PORT,
  CategoryUsagePort,
} from '@categories/application/ports/category-usage.port';

export interface DeleteCategoryCommand {
  id: string;
}

@Injectable()
export class DeleteCategoryHandler {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly repo: CategoryRepository,
    @Inject(CATEGORY_USAGE_PORT)
    private readonly usageChecker: CategoryUsagePort,
  ) {}

  async execute(command: DeleteCategoryCommand): Promise<void> {
    const existing = await this.repo.findById(command.id);
    if (!existing) {
      throw new NotFoundException(`Category ${command.id} not found`);
    }

    const isInUse = await this.usageChecker.isCategoryInUse(command.id);
    if (isInUse) {
      throw new ConflictException(
        `Category ${command.id} cannot be deleted because transactions reference it`,
      );
    }

    await this.repo.delete(command.id);
  }
}
