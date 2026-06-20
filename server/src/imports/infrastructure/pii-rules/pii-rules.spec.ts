import { IbanRule } from '@imports/infrastructure/pii-rules/iban.rule';
import { CardNumberRule } from '@imports/infrastructure/pii-rules/card-number.rule';
import { PeselRule } from '@imports/infrastructure/pii-rules/pesel.rule';
import { EmailRule } from '@imports/infrastructure/pii-rules/email.rule';
import { PhoneRule } from '@imports/infrastructure/pii-rules/phone.rule';

describe('IbanRule', () => {
  const rule = new IbanRule();

  const POSITIVE_CASES = [
    {
      input: 'Przelew na 61109010140000071219812874',
      label: 'Polish 26 digits (valid mod97)',
    },
    { input: 'PL61109010140000071219812874', label: 'Polish with PL prefix' },
    { input: 'DE89370400440532013000', label: 'German IBAN' },
    { input: 'GB29NWBK60161331926819', label: 'UK IBAN' },
    {
      input: 'Rachunek: 61109010140000071219812874',
      label: 'embedded in text',
    },
    { input: 'PL61 1090 1014 0000 0712 1981 2874', label: 'with spaces' },
  ];

  const NEGATIVE_CASES = [
    { input: 'Przelew za fakturę', label: 'normal text' },
    { input: '1234567890', label: '10 digits' },
    { input: 'OPERATION_B8791B80', label: 'hash-like string' },
    { input: 'ref:123456789012345', label: 'reference number (too short)' },
    { input: '100.00 PLN', label: 'amount' },
    {
      input: '12345678901234567890123456',
      label: '26 digits but invalid mod97',
    },
  ];

  it.each(POSITIVE_CASES)('detects: $label', ({ input }) => {
    expect(rule.detect(input)).toBe(true);
  });

  it.each(NEGATIVE_CASES)('ignores: $label', ({ input }) => {
    expect(rule.detect(input)).toBe(false);
  });
});

describe('CardNumberRule', () => {
  const rule = new CardNumberRule();

  const POSITIVE_CASES = [
    { input: '4111111111111111', label: 'Visa test number (Luhn valid)' },
    { input: '4111 1111 1111 1111', label: 'Visa with spaces' },
    { input: '4111-1111-1111-1111', label: 'Visa with dashes' },
    {
      input: 'Karta: 5500000000000004',
      label: 'Mastercard embedded (Luhn valid)',
    },
  ];

  const NEGATIVE_CASES = [
    { input: '557519******6968', label: 'masked card (stars)' },
    { input: '5575 19** **** 6968', label: 'masked card with spaces' },
    { input: '123456789012', label: '12 digits (too short)' },
    { input: 'OPERATION_B8791B80', label: 'hex hash' },
    { input: 'Zakup BLIK allegro.pl', label: 'normal description' },
    { input: '1234567890123456', label: '16 digits but Luhn invalid' },
  ];

  it.each(POSITIVE_CASES)('detects: $label', ({ input }) => {
    expect(rule.detect(input)).toBe(true);
  });

  it.each(NEGATIVE_CASES)('ignores: $label', ({ input }) => {
    expect(rule.detect(input)).toBe(false);
  });
});

describe('PeselRule', () => {
  const rule = new PeselRule();

  const POSITIVE_CASES = [
    { input: '44051401359', label: 'valid PESEL (checksum OK)' },
    { input: 'Identyfikator: 44051401359', label: 'embedded valid PESEL' },
  ];

  const NEGATIVE_CASES = [
    { input: '12345678901', label: '11 digits but invalid checksum' },
    { input: '123456789012', label: '12 digits' },
    { input: 'BLP0016960178', label: 'alphanumeric reference' },
    { input: 'rata 104', label: 'short number' },
  ];

  it.each(POSITIVE_CASES)('detects: $label', ({ input }) => {
    expect(rule.detect(input)).toBe(true);
  });

  it.each(NEGATIVE_CASES)('ignores: $label', ({ input }) => {
    expect(rule.detect(input)).toBe(false);
  });
});

describe('EmailRule', () => {
  const rule = new EmailRule();

  const POSITIVE_CASES = [
    { input: 'jan.kowalski@gmail.com', label: 'standard email' },
    { input: 'Kontakt: info@firma.pl', label: 'embedded in text' },
    { input: 'user+tag@domain.co.uk', label: 'email with plus and subdomain' },
  ];

  const NEGATIVE_CASES = [
    { input: 'allegro.pl', label: 'domain without @' },
    {
      input: 'Zakup BLIK allegro.pl WIERZBIĘCICE',
      label: 'domain in description',
    },
    { input: '@mention', label: 'at-mention' },
    { input: 'normal transaction description', label: 'plain text' },
  ];

  it.each(POSITIVE_CASES)('detects: $label', ({ input }) => {
    expect(rule.detect(input)).toBe(true);
  });

  it.each(NEGATIVE_CASES)('ignores: $label', ({ input }) => {
    expect(rule.detect(input)).toBe(false);
  });
});

describe('PhoneRule', () => {
  const rule = new PhoneRule();

  const POSITIVE_CASES = [
    { input: '+48 123 456 789', label: 'Polish mobile with spaces' },
    { input: '+48123456789', label: 'Polish mobile no spaces' },
    { input: 'Tel: +49301234567', label: 'German number embedded' },
  ];

  const NEGATIVE_CASES = [
    { input: '123456789', label: '9 digits without + prefix' },
    { input: 'ref:123456789', label: 'reference number' },
    { input: '100.00 PLN', label: 'amount' },
    { input: 'BLIK 123456', label: 'BLIK code (6 digits)' },
  ];

  it.each(POSITIVE_CASES)('detects: $label', ({ input }) => {
    expect(rule.detect(input)).toBe(true);
  });

  it.each(NEGATIVE_CASES)('ignores: $label', ({ input }) => {
    expect(rule.detect(input)).toBe(false);
  });
});
