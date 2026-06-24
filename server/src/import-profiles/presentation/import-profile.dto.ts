import { z } from 'zod';

const columnMappingSchema = z
  .object({
    sourceColumn: z.string().min(1),
    targetField: z.string().min(1),
    isRequired: z.boolean(),
  })
  .strict();

const parserConfigSchema = z
  .object({
    delimiter: z.string().min(1).max(10),
    hasHeader: z.boolean(),
    dateFormat: z.string().min(1),
    encoding: z.string().min(1),
  })
  .strict();

const anonymizationConfigSchema = z
  .object({
    fieldsToAnonymize: z.array(z.string().min(1)).min(1),
    strategy: z.enum(['Hash', 'Mask', 'Remove']),
  })
  .strict();

export const createImportProfileSchema = z
  .object({
    name: z.string().min(1).max(255),
    columnMappings: z.array(columnMappingSchema).min(1),
    parserConfig: parserConfigSchema,
    anonymizationConfig: anonymizationConfigSchema,
  })
  .strict();

export type CreateImportProfileDto = z.infer<typeof createImportProfileSchema>;

export const updateImportProfileSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    columnMappings: z.array(columnMappingSchema).min(1).optional(),
    parserConfig: parserConfigSchema.optional(),
    anonymizationConfig: anonymizationConfigSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.columnMappings !== undefined ||
      data.parserConfig !== undefined ||
      data.anonymizationConfig !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateImportProfileDto = z.infer<typeof updateImportProfileSchema>;

export const detectProfileSchema = z
  .object({
    headers: z.array(z.string().min(1)).min(1),
  })
  .strict();

export type DetectProfileDto = z.infer<typeof detectProfileSchema>;
