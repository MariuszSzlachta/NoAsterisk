import { describe, expect, it } from 'vitest';

import { rotationIdentifierSchema } from '#shared/api/vault-protocol/dual-root-rotation/rotationIdentifierSchema';

describe('rotationIdentifierSchema', () => {
  it.each([
    ['id', true],
    ['', false],
    ['a'.repeat(128), true],
    ['a'.repeat(129), false],
  ])('should enforce the boundary for %s', (value, expected) => {
    expect(rotationIdentifierSchema.safeParse(value).success).toBe(expected);
  });
});
