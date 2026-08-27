import { describe, expect, it } from 'vitest';

import type { ColumnMapping } from '../types';
import { hasRequiredFields } from './has-required-fields';

describe('hasRequiredFields', () => {
  it('returns true with date + title + amount', () => {
    const mapping: ColumnMapping = { A: 'date', B: 'title', C: 'amount' };
    expect(hasRequiredFields(mapping)).toBe(true);
  });

  it('returns true with date + title + debit/credit', () => {
    const mapping: ColumnMapping = { A: 'date', B: 'title', C: 'debit', D: 'credit' };
    expect(hasRequiredFields(mapping)).toBe(true);
  });

  it('returns false without date', () => {
    const mapping: ColumnMapping = { A: 'title', B: 'amount' };
    expect(hasRequiredFields(mapping)).toBe(false);
  });

  it('returns false without title', () => {
    const mapping: ColumnMapping = { A: 'date', B: 'amount' };
    expect(hasRequiredFields(mapping)).toBe(false);
  });

  it('returns false without amount or debit/credit', () => {
    const mapping: ColumnMapping = { A: 'date', B: 'title', C: 'currency' };
    expect(hasRequiredFields(mapping)).toBe(false);
  });

  it('returns false for empty mapping', () => {
    expect(hasRequiredFields({})).toBe(false);
  });
});
