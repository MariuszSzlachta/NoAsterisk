import { describe, expect, it } from 'vitest';

import { canonicalizeEmail } from '#features/auth/model/canonicalize-email';

describe('canonicalizeEmail', () => {
  it('trims leading whitespace', () => {
    expect(canonicalizeEmail('  user@example.com')).toBe('user@example.com');
  });

  it('trims trailing whitespace', () => {
    expect(canonicalizeEmail('user@example.com   ')).toBe('user@example.com');
  });

  it('trims both leading and trailing whitespace', () => {
    expect(canonicalizeEmail('  user@example.com  ')).toBe('user@example.com');
  });

  it('converts uppercase letters to lowercase', () => {
    expect(canonicalizeEmail('User@Example.COM')).toBe('user@example.com');
  });

  it('handles mixed case with whitespace', () => {
    expect(canonicalizeEmail('  Admin@Budget.PL  ')).toBe('admin@budget.pl');
  });

  it('returns empty string for empty input', () => {
    expect(canonicalizeEmail('')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(canonicalizeEmail('   ')).toBe('');
  });

  it('does not alter already canonical email', () => {
    expect(canonicalizeEmail('already@canonical.io')).toBe('already@canonical.io');
  });

  it('handles tabs and newlines as whitespace', () => {
    expect(canonicalizeEmail('\t user@test.com \n')).toBe('user@test.com');
  });
});
