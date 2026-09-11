import { describe, expect, it } from 'vitest';

import { getXAxisTickValues } from './getXAxisTickValues';

const series = (values: Array<string | number>) => [
  {
    id: 'income',
    data: values.map((x) => ({ x, y: 0 })),
  },
];

describe('getXAxisTickValues', () => {
  it('returns all labels when they fit the requested limit', () => {
    expect(getXAxisTickValues(series(['Jan', 'Feb', 'Mar']))).toEqual([
      'Jan',
      'Feb',
      'Mar',
    ]);
  });

  it('keeps the first and last labels and samples the middle', () => {
    expect(getXAxisTickValues(series(['1', '2', '3', '4', '5', '6', '7']), 4)).toEqual([
      '1',
      '3',
      '5',
      '7',
    ]);
  });

  it('returns no labels for an empty series', () => {
    expect(getXAxisTickValues([])).toEqual([]);
  });
});
