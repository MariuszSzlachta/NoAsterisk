import { describe, expect, it } from 'vitest';

import { isRecord } from './is-record';

describe('isRecord', () => {
  it.each([{}, { name: 'Groceries' }, Object.create(null)])(
    'accepts a non-null, non-array object',
    (value) => {
      expect(isRecord(value)).toBe(true);
    },
  );

  it.each([null, [], 'record', 42, undefined])(
    'rejects values that are not records',
    (value) => {
      expect(isRecord(value)).toBe(false);
    },
  );
});
