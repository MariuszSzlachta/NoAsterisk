import { Injectable } from '@nestjs/common';
import { PiiRule, PiiViolationType } from '@imports/application/ports/pii-rule.port';

const EMAIL_PATTERN = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/;

@Injectable()
export class EmailRule implements PiiRule {
  readonly type = PiiViolationType.Email;

  detect(value: string): boolean {
    return EMAIL_PATTERN.test(value);
  }
}
