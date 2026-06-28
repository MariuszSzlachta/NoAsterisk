import { getYRange } from './getYRange';

describe('getYRange', () => {
  it('returns min and max from single series', () => {
    const data = [{ id: 'a', data: [{ x: 'Sty', y: 100 }, { x: 'Lut', y: 300 }, { x: 'Mar', y: 200 }] }];
    expect(getYRange(data)).toEqual({ min: 100, max: 300 });
  });

  it('returns min and max across multiple series', () => {
    const data = [
      { id: 'a', data: [{ x: 'Sty', y: 50 }, { x: 'Lut', y: 200 }] },
      { id: 'b', data: [{ x: 'Sty', y: 10 }, { x: 'Lut', y: 500 }] },
    ];
    expect(getYRange(data)).toEqual({ min: 10, max: 500 });
  });

  it('returns zeros for empty data', () => {
    expect(getYRange([])).toEqual({ min: 0, max: 0 });
  });

  it('handles single point', () => {
    const data = [{ id: 'a', data: [{ x: 'Sty', y: 42 }] }];
    expect(getYRange(data)).toEqual({ min: 42, max: 42 });
  });
});
