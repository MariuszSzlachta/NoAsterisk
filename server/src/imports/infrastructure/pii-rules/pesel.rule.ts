import { Injectable } from '@nestjs/common';
import { PiiRule, PiiViolationType } from '@imports/application/ports/pii-rule.port';

// PESEL: 11 digits, standalone (not part of longer number)
// Validates checksum to reduce false positives
const PESEL_PATTERN = /\b\d{11}\b/;
const PESEL_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];

@Injectable()
export class PeselRule implements PiiRule {
  readonly type = PiiViolationType.Pesel;

  detect(value: string): boolean {
    const match = PESEL_PATTERN.exec(value);
    if (!match) return false;
    return this.isValidChecksum(match[0]);
  }

  private isValidChecksum(pesel: string): boolean {
    const digits = pesel.split('').map(Number);
    const sum = PESEL_WEIGHTS.reduce(
      (acc, weight, i) => acc + weight * (digits[i] ?? 0),
      0,
    );
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[10];
  }
}
