import { describe, expect, it } from 'vitest';

import { scoreSample } from '#features/csv-import/model/parsing/amount-parser/score-sample';

describe('scoreSample', () => {
  describe('PL format', () => {
    it.each([
      ['-87,43', { pl: 1, en: 0 }],
      ['1 234,56', { pl: 1, en: 0 }],
      ['8 500,00', { pl: 1, en: 0 }],
      ['1.234,56', { pl: 1, en: 0 }],
    ])('scores "%s" as PL', (input, expected) => {
      expect(scoreSample(input)).toEqual(expected);
    });
  });

  describe('EN format', () => {
    it.each([
      ['-87.43', { pl: 0, en: 1 }],
      ['1,234.56', { pl: 0, en: 1 }],
      ['8,500.00', { pl: 0, en: 1 }],
    ])('scores "%s" as EN', (input, expected) => {
      expect(scoreSample(input)).toEqual(expected);
    });
  });

  describe('neutral', () => {
    it.each([['100'], ['-250'], ['0']])(
      'scores "%s" as neutral (0/0)',
      (input) => {
        expect(scoreSample(input)).toEqual({ pl: 0, en: 0 });
      },
    );
  });

  describe('empty', () => {
    it.each([[''], ['   ']])('scores "%s" as neutral (0/0)', (input) => {
      expect(scoreSample(input)).toEqual({ pl: 0, en: 0 });
    });
  });
});
