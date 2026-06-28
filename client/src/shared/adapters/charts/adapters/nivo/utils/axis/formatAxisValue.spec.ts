import { formatAxisValue } from './formatAxisValue';

describe('formatAxisValue', () => {
  it.each([
    [0, '0'],
    [500, '500'],
    [999, '999'],
    [1000, '1k'],
    [1500, '1.5k'],
    [2000, '2k'],
    [2100, '2.1k'],
    [2300, '2.3k'],
    [5000, '5k'],
    [9999, '10k'],
    [10000, '10k'],
    [12500, '13k'],
    [100000, '100k'],
  ])('formats %d as "%s"', (input, expected) => {
    expect(formatAxisValue(input)).toBe(expected);
  });
});
