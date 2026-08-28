import { describe, it, expect } from 'vitest';
import { toAddressSpan } from '#features/csv-import/model/anonymization/detectors/address-detector/to-span';

const createMatch = (
  text: string,
  index: number,
): RegExpMatchArray => {
  const match = [text] as RegExpMatchArray;
  match.index = index;
  match.input = text;
  match.groups = undefined;
  return match;
};

describe('toAddressSpan', () => {
  it('creates a detection span from a regex match', () => {
    const match = createMatch('ul. Testowa 5', 10);
    const result = toAddressSpan(match, 0.88);

    expect(result).toEqual({
      start: 10,
      end: 23,
      type: 'address',
      confidence: 0.88,
      original: 'ul. Testowa 5',
      detectorId: 'address',
    });
  });

  it('defaults start to 0 when match.index is undefined', () => {
    const match = createMatch('test', undefined as unknown as number);
    match.index = undefined;
    const result = toAddressSpan(match, 0.5);

    expect(result.start).toBe(0);
    expect(result.end).toBe(4);
  });
});
