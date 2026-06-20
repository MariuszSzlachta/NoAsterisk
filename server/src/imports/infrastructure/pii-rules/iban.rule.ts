import { Injectable } from '@nestjs/common';
import {
  PiiRule,
  PiiViolationType,
} from '@imports/application/ports/pii-rule.port';

// International IBAN with country code prefix, or Polish 26 digits standalone
const IBAN_WITH_PREFIX =
  /\b[A-Z]{2}\d{2}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z\s]{2,18}\b/;
const POLISH_BARE = /\b\d{26}\b/;

@Injectable()
export class IbanRule implements PiiRule {
  readonly type = PiiViolationType.Iban;

  detect(value: string): boolean {
    if (IBAN_WITH_PREFIX.test(value)) return true;

    const match = POLISH_BARE.exec(value);
    if (!match) return false;
    return this.isValidPolishIban(match[0]);
  }

  private isValidPolishIban(digits26: string): boolean {
    // Polish IBAN without prefix: first 2 digits are check digits
    // Rearrange: move check digits to end, prepend country code (PL=2521)
    // Full rearrangement: bankAccountNumber + "PL" + checkDigits
    // In numeric: digits[2..25] + "2521" + digits[0..1]
    const rearranged = digits26.slice(2) + '2521' + digits26.slice(0, 2);
    return this.mod97(rearranged) === 1;
  }

  private mod97(numericString: string): number {
    let remainder = 0;
    for (const char of numericString) {
      remainder = (remainder * 10 + Number(char)) % 97;
    }
    return remainder;
  }
}
