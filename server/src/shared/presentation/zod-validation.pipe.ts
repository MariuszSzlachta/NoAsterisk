import { PipeTransform, BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const fields = [
        ...new Set(result.error.issues.map((i) => String(i.path[0]))),
      ];
      throw new BadRequestException({
        message: 'Validation failed',
        fields,
      });
    }
    return result.data;
  }
}
