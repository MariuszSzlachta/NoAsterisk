import { describe, expect, it } from 'vitest';

import { isRecord } from './is-record';

describe('isRecord', () => {
  it.each([{}, { id: 'user-1' }, Object.create(null)])(
    'accepts record-shaped values',
    (value) => {
      expect(isRecord(value)).toBe(true);
    },
  );

  it.each([null, [], 'user', 1, undefined])(
    'rejects values that are not records',
    (value) => {
      expect(isRecord(value)).toBe(false);
    },
  );
});
