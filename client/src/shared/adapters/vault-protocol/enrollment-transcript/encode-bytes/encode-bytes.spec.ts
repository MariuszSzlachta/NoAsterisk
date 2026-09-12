import { describe, expect, it } from 'vitest';

import { encodeEnrollmentBytes } from '#shared/adapters/vault-protocol/enrollment-transcript/encode-bytes';

describe('bounded enrollment JSON bytes', () => {
  it('should preserve Unicode/null/escapes and bound actual byte expansion', () => {
    expect(
      new TextDecoder().decode(encodeEnrollmentBytes(['ą', null, 2, '"'])),
    ).toBe('["ą",null,2,"\\""]');
    expect(() => encodeEnrollmentBytes(['a'.repeat(65_532)])).not.toThrow();
    expect(() => encodeEnrollmentBytes(['a'.repeat(65_533)])).toThrow();
    expect(() => encodeEnrollmentBytes(['ą'.repeat(32_767)])).toThrow();
  });
});
