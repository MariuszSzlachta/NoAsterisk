import { Injectable, Inject } from '@nestjs/common';
import { Category } from '@categories/domain/category.entity';
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
} from '@categories/application/ports/category.repository';
import { CategoryResponseDto } from '@categories/application/dto/category-response.dto';
import { CategoryResponseMapper } from '@categories/application/mappers/category-response.mapper';

export interface CreateCategoryCommand {
  name: string;
}

@Injectable()
export class CreateCategoryHandler {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly repo: CategoryRepository,
  ) {}

  async execute(command: CreateCategoryCommand): Promise<CategoryResponseDto> {
    const category = Category.create({ name: command.name });
    const saved = await this.repo.save(category);
    return CategoryResponseMapper.toDto(saved);
  }
}
