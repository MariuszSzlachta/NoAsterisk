import { describe, expect, it } from 'vitest';

import { anonymize, detectPii, processRows } from './anonymizer';

describe('detectPii', () => {
  it('detects IBAN numbers', () => {
    const text = 'PRZELEW Jan Kowalski PL61 2490 0005 0000 4000 1234 5678';
    const matches = detectPii(text);

    const iban = matches.find((m) => m.type === 'iban');
    expect(iban).toBeDefined();
    expect(iban!.original).toContain('PL');
  });

  it('detects phone numbers', () => {
    const text = 'PRZELEW +48 123 456 789 za usługę';
    const matches = detectPii(text);

    const phone = matches.find((m) => m.type === 'phone');
    expect(phone).toBeDefined();
    expect(phone!.masked).toContain('••••');
  });

  it('detects names (capitalized word pairs)', () => {
    const text = 'PRZELEW Jan Kowalski za fakturę';
    const matches = detectPii(text);

    const name = matches.find((m) => m.type === 'name');
    expect(name).toBeDefined();
    expect(name!.original).toBe('Jan Kowalski');
  });

  it('ignores known non-name phrases', () => {
    const text = 'Przelew Wychodzący na konto';
    const matches = detectPii(text);

    expect(matches.filter((m) => m.type === 'name')).toHaveLength(0);
  });

  it('returns empty for text without PII', () => {
    const text = 'BIEDRONKA 1234 WARSZAWA';
    const matches = detectPii(text);

    expect(matches).toHaveLength(0);
  });

  it('handles multiple matches in one string', () => {
    const text = 'PRZELEW Jan Kowalski +48 600 700 800 na PL61 2490 0005 0000 4000 1234 5678';
    const matches = detectPii(text);

    expect(matches.length).toBeGreaterThanOrEqual(3);
  });
});

describe('anonymize', () => {
  it('replaces PII with masked versions', () => {
    const text = 'PRZELEW Jan Kowalski za usługę';
    const matches = detectPii(text);
    const result = anonymize(text, matches);

    expect(result).not.toContain('Jan Kowalski');
    expect(result).toContain('J••');
  });

  it('preserves text without matches', () => {
    const result = anonymize('BIEDRONKA 1234', []);
    expect(result).toBe('BIEDRONKA 1234');
  });
});

describe('processRows', () => {
  it('marks rows without PII as safe', () => {
    const rows = [{ title: 'BIEDRONKA 1234 WARSZAWA' }];
    const entries = processRows(rows, 'title');

    expect(entries[0].status).toBe('safe');
    expect(entries[0].accepted).toBe(true);
  });

  it('marks rows with PII as needs_review', () => {
    const rows = [{ title: 'PRZELEW Jan Kowalski' }];
    const entries = processRows(rows, 'title');

    expect(entries[0].status).toBe('needs_review');
    expect(entries[0].accepted).toBe(false);
    expect(entries[0].anonymizedTitle).not.toContain('Jan Kowalski');
  });
});
