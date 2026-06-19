import { Module, forwardRef } from '@nestjs/common';
import { CATEGORY_REPOSITORY } from '@categories/application/ports/category.repository';
import { CreateCategoryHandler } from '@categories/application/commands/create-category.handler';
import { UpdateCategoryHandler } from '@categories/application/commands/update-category.handler';
import { DeleteCategoryHandler } from '@categories/application/commands/delete-category.handler';
import { GetCategoriesHandler } from '@categories/application/queries/get-categories.handler';
import { InMemoryCategoryRepository } from '@categories/infrastructure/in-memory-category.repository';
import { CategoriesController } from '@categories/presentation/categories.controller';
import { TransactionsModule } from '@transactions/transactions.module';

@Module({
  imports: [forwardRef(() => TransactionsModule)],
  controllers: [CategoriesController],
  providers: [
    {
      provide: CATEGORY_REPOSITORY,
      useClass: InMemoryCategoryRepository,
    },
    CreateCategoryHandler,
    UpdateCategoryHandler,
    DeleteCategoryHandler,
    GetCategoriesHandler,
  ],
  exports: [CATEGORY_REPOSITORY],
})
export class CategoriesModule {}
