import { describe, expect, it } from 'vitest';

import { isRotationIdentifier } from '#shared/adapters/vault-protocol/rotation-transcript/isRotationIdentifier';

describe('isRotationIdentifier', () => {
  it.each([
    ['', false],
    ['id', true],
    ['a'.repeat(128), true],
    ['a'.repeat(129), false],
  ])('should enforce bounded identifiers for %s', (value, expected) => {
    expect(isRotationIdentifier(value)).toBe(expected);
  });
});
