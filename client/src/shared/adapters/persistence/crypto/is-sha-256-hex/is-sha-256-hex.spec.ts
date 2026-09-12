import { describe, expect, it } from 'vitest';

import { SHA_256_HEX_LENGTH } from '#shared/adapters/persistence/crypto/constants';
import { isSha256Hex } from '#shared/adapters/persistence/crypto/is-sha-256-hex';

describe('isSha256Hex', () => {
  it('accepts a canonical lowercase SHA-256 digest', () => {
    expect(isSha256Hex('a'.repeat(SHA_256_HEX_LENGTH))).toBe(true);
  });

  it('rejects a digest with the wrong length', () => {
    expect(isSha256Hex('a'.repeat(SHA_256_HEX_LENGTH - 1))).toBe(false);
  });

  it('rejects uppercase and non-hex characters', () => {
    expect(isSha256Hex('A'.repeat(SHA_256_HEX_LENGTH))).toBe(false);
    expect(isSha256Hex('g'.repeat(SHA_256_HEX_LENGTH))).toBe(false);
  });
});
