import { describe, expect, it } from 'vitest';

import { createEmailPattern } from './create-email.pattern';

describe('createEmailPattern', () => {
  it.each([
    ['jan.kowalski@gmail.com', 'jan.kowalski@gmail.com'],
    ['info@firma.pl', 'info@firma.pl'],
    ['user@mail.company.co.uk', 'user@mail.company.co.uk'],
    ['test+tag@example.com', 'test+tag@example.com'],
    ['a@domain.io', 'a@domain.io'],
    ['user_name@sub.domain.org', 'user_name@sub.domain.org'],
    ['UPPER@CASE.COM', 'UPPER@CASE.COM'],
  ])('matches: "%s"', (input, expected) => {
    const pattern = createEmailPattern();
    const match = pattern.exec(input);

    expect(match).not.toBeNull();
    expect(match[0]).toBe(expected);
  });

  it.each([
    'SPOTIFY PREMIUM spotify.com subscription',
    'plain text without email',
    'user@',
    '@domain.com',
    'user@domain',
    'user@domain.c',
  ])('does NOT match: "%s"', (input) => {
    const pattern = createEmailPattern();

    expect(pattern.exec(input)).toBeNull();
  });

  it('finds email embedded in text', () => {
    const pattern = createEmailPattern();
    const match = pattern.exec('PRZELEW jan.kowalski@gmail.com za usługę');

    expect(match).not.toBeNull();
    expect(match[0]).toBe('jan.kowalski@gmail.com');
  });

  it('returns fresh instance (no shared lastIndex)', () => {
    const p1 = createEmailPattern();
    const p2 = createEmailPattern();

    p1.exec('test@example.com');

    expect(p2.lastIndex).toBe(0);
  });
});
