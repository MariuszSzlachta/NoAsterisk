export const PII_RULES = Symbol('PII_RULES');

export enum PiiViolationType {
  Iban = 'potential_iban',
  CardNumber = 'potential_card_number',
  Pesel = 'potential_pesel',
  Email = 'potential_email',
  Phone = 'potential_phone',
}

export interface PiiViolation {
  type: PiiViolationType;
  field: string;
  rowIndex: number;
}

export interface FieldToValidate {
  value: string;
  field: string;
  rowIndex: number;
}

export interface PiiRule {
  readonly type: PiiViolationType;
  detect(value: string): boolean;
}
