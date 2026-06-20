import { Injectable } from '@nestjs/common';
import {
  PiiRule,
  PiiViolationType,
} from '@imports/application/ports/pii-rule.port';

// Polish phone: +48 followed by 9 digits (with optional spaces)
// International: + followed by country code and number (9-15 digits total)
const PHONE_PATTERN = /(?<!\d)\+\d[\d\s]{8,16}(?!\d)/;

@Injectable()
export class PhoneRule implements PiiRule {
  readonly type = PiiViolationType.Phone;

  detect(value: string): boolean {
    return PHONE_PATTERN.test(value);
  }
}
