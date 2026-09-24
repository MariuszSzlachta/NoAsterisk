import { describe, expect, it } from 'vitest';

import { buildRotationFixture } from '#shared/adapters/vault-protocol/dual-root-vault-rotation/testing/buildRotationFixture';
import { isRotationTranscriptWithinLimit } from '#shared/api/vault-protocol/dual-root-rotation/isRotationTranscriptWithinLimit';

describe('isRotationTranscriptWithinLimit', () => {
  it('should reject combined UTF8 bytes beyond the canonical limit', async () => {
    const f = await buildRotationFixture();
    expect(isRotationTranscriptWithinLimit(f.transcript)).toBe(true);
    expect(
      isRotationTranscriptWithinLimit({
        ...f.transcript,
        envelope: 'ą'.repeat(33_000),
      }),
    ).toBe(false);
  });
});
