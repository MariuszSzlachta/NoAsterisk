import { z } from 'zod';

export const CreateCategoryDto = z.object({
  name: z.string().min(1).max(100),
});

export type CreateCategoryDto = z.infer<typeof CreateCategoryDto>;

export const UpdateCategoryDto = z.object({
  name: z.string().min(1).max(100),
});

export type UpdateCategoryDto = z.infer<typeof UpdateCategoryDto>;
