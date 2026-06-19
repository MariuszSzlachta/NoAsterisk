import { Category } from '@categories/domain/category.entity';
import { CategoryResponseDto } from '@categories/application/dto/category-response.dto';

export class CategoryResponseMapper {
  static toDto(entity: Category): CategoryResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
