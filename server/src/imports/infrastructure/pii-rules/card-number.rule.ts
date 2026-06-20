import { Injectable } from '@nestjs/common';
import { PiiRule, PiiViolationType } from '@imports/application/ports/pii-rule.port';

const CARD_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;

@Injectable()
export class CardNumberRule implements PiiRule {
  readonly type = PiiViolationType.CardNumber;

  detect(value: string): boolean {
    const match = CARD_PATTERN.exec(value);
    if (!match) return false;

    const digits = match[0].replace(/[\s-]/g, '');
    if (digits.includes('*')) return false;

    return this.isLuhnValid(digits);
  }

  private isLuhnValid(digits: string): boolean {
    let sum = 0;
    let alternate = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let n = Number(digits[i]);
      if (alternate) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alternate = !alternate;
    }

    return sum % 10 === 0;
  }
}
