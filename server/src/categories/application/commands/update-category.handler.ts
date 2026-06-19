import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
} from '@categories/application/ports/category.repository';
import { CategoryResponseDto } from '@categories/application/dto/category-response.dto';
import { CategoryResponseMapper } from '@categories/application/mappers/category-response.mapper';

export interface UpdateCategoryCommand {
  id: string;
  name: string;
}

@Injectable()
export class UpdateCategoryHandler {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly repo: CategoryRepository,
  ) {}

  async execute(command: UpdateCategoryCommand): Promise<CategoryResponseDto> {
    const existing = await this.repo.findById(command.id);
    if (!existing) {
      throw new NotFoundException(`Category ${command.id} not found`);
    }
    const updated = existing.rename(command.name);
    const saved = await this.repo.save(updated);
    return CategoryResponseMapper.toDto(saved);
  }
}
