import { describe, expect, it } from 'vitest';

import { isArrayBuffer } from './is-array-buffer';

describe('isArrayBuffer', () => {
  it('accepts an ArrayBuffer', () => {
    expect(isArrayBuffer(new ArrayBuffer(8))).toBe(true);
  });

  it.each([new Uint8Array(8), {}, null, 'buffer'])(
    'rejects a non-ArrayBuffer value',
    (value) => {
      expect(isArrayBuffer(value)).toBe(false);
    },
  );
});
