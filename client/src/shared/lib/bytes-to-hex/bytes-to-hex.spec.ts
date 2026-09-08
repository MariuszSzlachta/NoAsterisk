import { describe, expect, it } from 'vitest';

import { bytesToHex } from '#shared/lib/bytes-to-hex';

describe('bytesToHex', () => {
  it('preserves leading zeroes in canonical lowercase hex', () => {
    expect(bytesToHex(new Uint8Array([0, 15, 16, 255]))).toBe('000f10ff');
  });

  it('returns an empty string for an empty byte sequence', () => {
    expect(bytesToHex(new Uint8Array())).toBe('');
  });
});
