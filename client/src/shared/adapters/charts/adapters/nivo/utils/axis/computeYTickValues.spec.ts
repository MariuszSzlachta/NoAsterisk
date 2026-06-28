import { computeYTickValues } from './computeYTickValues';

describe('computeYTickValues', () => {
  it('returns nice ticks for narrow range (1950-2300)', () => {
    const data = [{ id: 'a', data: [{ x: 'Sty', y: 1950 }, { x: 'Lut', y: 2300 }] }];
    const ticks = computeYTickValues(data);
    expect(ticks).toEqual([1800, 1900, 2000, 2100, 2200, 2300]);
  });

  it('returns nice ticks for wide range (12-4100)', () => {
    const data = [{ id: 'a', data: [{ x: 'Sty', y: 12 }, { x: 'Lut', y: 4100 }] }];
    const ticks = computeYTickValues(data);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(4100);
    expect(ticks.length).toBeLessThanOrEqual(6);
  });

  it('returns single value for flat line (7000-7000)', () => {
    const data = [{ id: 'a', data: [{ x: 'Sty', y: 7000 }, { x: 'Lut', y: 7000 }] }];
    expect(computeYTickValues(data)).toEqual([7000]);
  });

  it('returns nice ticks for 0-6000 range', () => {
    const data = [{ id: 'a', data: [{ x: 'Sty', y: 0 }, { x: 'Lut', y: 6000 }] }];
    const ticks = computeYTickValues(data);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBe(6000);
    expect(new Set(ticks).size).toBe(ticks.length); // no duplicates
  });

  it('produces no duplicate values', () => {
    const data = [{ id: 'a', data: [{ x: 'Sty', y: 1050 }, { x: 'Lut', y: 1070 }] }];
    const ticks = computeYTickValues(data);
    expect(new Set(ticks).size).toBe(ticks.length);
  });
});
