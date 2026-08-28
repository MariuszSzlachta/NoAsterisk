import { describe, expect, it } from 'vitest';

import { resolveStrategy } from '#features/csv-import/model/parsing/strategies/resolve-strategy';

describe('resolveStrategy (integration)', () => {
  it('returns anchor when data has date-start + amount-end pattern', () => {
    const headers = ['Data', 'Opis', 'Kwota', 'Saldo'];
    const dataRows = Array.from({ length: 10 }, () => [
      '14.06.2025',
      'ZAKUP',
      '-87,43',
      '3 840,67',
    ]);

    const result = resolveStrategy(headers, dataRows, ';');
    expect(result.strategy.type).toBe('overflow-merge');
    expect(result.config.expectedColumnCount).toBe(4);
  });

  it('returns direct when no overflow rows', () => {
    const headers = ['A', 'B', 'C'];
    const dataRows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
    ];

    const result = resolveStrategy(headers, dataRows, ';');
    expect(result.strategy.type).toBe('direct');
  });

  it('returns overflow-merge when overflow + known column keyword (no anchor pattern)', () => {
    const headers = ['Data', 'Opis operacji', 'Kwota'];
    // Data without dates at start → no anchor pattern, but overflow
    const dataRows = Array.from({ length: 10 }, () => [
      'text',
      'more',
      'extra',
      'stuff',
    ]);

    const result = resolveStrategy(headers, dataRows, ';');
    expect(result.strategy.type).toBe('overflow-merge');
    expect(result.config.overflowColumnIndex).toBe(1);
  });

  it('returns direct when overflow but no known overflow column', () => {
    const headers = ['A', 'B', 'C'];
    const dataRows = [['1', '2', '3', '4']];

    const result = resolveStrategy(headers, dataRows, ';');
    expect(result.strategy.type).toBe('direct');
  });

  it('includes fixedTailColumns in overflow-merge config', () => {
    const headers = ['Data', 'Opis operacji', 'Kategoria', 'Kwota'];
    // No anchor pattern: no dates at start
    const dataRows = Array.from({ length: 10 }, () => [
      'text',
      'a',
      'b',
      'c',
      'extra',
    ]);

    const result = resolveStrategy(headers, dataRows, ';');
    expect(result.config.fixedTailColumns).toBe(2);
  });
});
