import { Injectable, Inject } from '@nestjs/common';
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
} from '@categories/application/ports/category.repository';
import { CategoryResponseDto } from '@categories/application/dto/category-response.dto';
import { CategoryResponseMapper } from '@categories/application/mappers/category-response.mapper';

@Injectable()
export class GetCategoriesHandler {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly repo: CategoryRepository,
  ) {}

  async execute(): Promise<CategoryResponseDto[]> {
    const categories = await this.repo.findAll();
    return categories.map(CategoryResponseMapper.toDto);
  }
}
