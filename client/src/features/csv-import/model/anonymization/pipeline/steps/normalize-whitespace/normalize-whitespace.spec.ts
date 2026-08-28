import { describe, expect, it } from 'vitest';

import { normalizeWhitespace } from '#features/csv-import/model/anonymization/pipeline/steps/normalize-whitespace';

describe('normalizeWhitespace', () => {
  it('replaces tabs with single space', () => {
    expect(normalizeWhitespace('a\tb\tc')).toBe('a b c');
  });

  it('collapses multiple spaces into one', () => {
    expect(normalizeWhitespace('a    b   c')).toBe('a b c');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeWhitespace('  hello world  ')).toBe('hello world');
  });

  it('handles combined tabs, spaces, and trimming', () => {
    expect(normalizeWhitespace('\t  a  \t  b  \t')).toBe('a b');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeWhitespace('   \t  ')).toBe('');
  });

  it('preserves already clean text', () => {
    expect(normalizeWhitespace('hello world')).toBe('hello world');
  });
});
