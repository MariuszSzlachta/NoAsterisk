import { describe, expect, it } from 'vitest';

import { rotationPublicKeySchema } from '#shared/api/vault-protocol/dual-root-rotation/rotationPublicKeySchema';

describe('rotationPublicKeySchema', () => {
  it.each([
    ['a'.repeat(64), true],
    ['a'.repeat(63), false],
    ['A'.repeat(64), false],
    ['g'.repeat(64), false],
  ])('should enforce the boundary for %s', (value, expected) => {
    expect(rotationPublicKeySchema.safeParse(value).success).toBe(expected);
  });
});
