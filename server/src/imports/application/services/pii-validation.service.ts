import { Injectable, Inject } from '@nestjs/common';
import {
  PII_RULES,
  PiiRule,
  PiiViolation,
  FieldToValidate,
} from '@imports/application/ports/pii-rule.port';

@Injectable()
export class PiiValidationService {
  constructor(@Inject(PII_RULES) private readonly rules: PiiRule[]) {}

  validate(fields: FieldToValidate[]): PiiViolation[] {
    return fields.flatMap((field) => this.checkField(field));
  }

  private checkField(field: FieldToValidate): PiiViolation[] {
    const sanitized = this.stripZeroWidth(field.value);
    return this.rules
      .filter((rule) => rule.detect(sanitized))
      .map((rule) => ({
        type: rule.type,
        field: field.field,
        rowIndex: field.rowIndex,
      }));
  }

  private stripZeroWidth(value: string): string {
    return value.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');
  }
}
