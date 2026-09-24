import { describe, expect, it } from 'vitest';

import { rotationProofSchema } from '#shared/api/vault-protocol/dual-root-rotation/rotationProofSchema';

describe('rotationProofSchema', () => {
  it.each([
    ['a'.repeat(128), true],
    ['a'.repeat(127), false],
    ['g'.repeat(128), false],
  ])('should validate both bounded signatures', (signature, expected) => {
    expect(
      rotationProofSchema.safeParse({
        deviceSignature: signature,
        recoverySignature: signature,
      }).success,
    ).toBe(expected);
  });
});
