import { describe, expect, it } from 'vitest';

import { parseMetricsParam } from './parseMetricsParam';

describe('parseMetricsParam', () => {
  it('returns default when param is null', () => {
    expect(parseMetricsParam(null)).toEqual(['expenses']);
  });

  it('returns default when param is empty string', () => {
    expect(parseMetricsParam('')).toEqual(['expenses']);
  });

  it('parses single valid metric', () => {
    expect(parseMetricsParam('income')).toEqual(['income']);
  });

  it('parses comma-separated valid metrics', () => {
    expect(parseMetricsParam('balance,income,expenses')).toEqual([
      'balance',
      'income',
      'expenses',
    ]);
  });

  it('filters out invalid values', () => {
    expect(parseMetricsParam('income,,invalid,expenses')).toEqual([
      'income',
      'expenses',
    ]);
  });

  it('returns default when all values are invalid', () => {
    expect(parseMetricsParam('foo,bar,baz')).toEqual(['expenses']);
  });
});
