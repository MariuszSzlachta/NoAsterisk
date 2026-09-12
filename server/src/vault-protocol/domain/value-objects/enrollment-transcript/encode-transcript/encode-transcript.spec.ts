import { DomainError } from '@budget/domain';
import { encodeEnrollmentTranscript } from '@vault-protocol/domain/value-objects/enrollment-transcript/encode-transcript';

describe('bounded canonical enrollment bytes', () => {
  it('should preserve Unicode, null slots and escaped string bytes', () => {
    expect(
      new TextDecoder().decode(encodeEnrollmentTranscript(['ą', null, 2, '"'])),
    ).toBe('["ą",null,2,"\\""]');
  });
  it('should enforce byte length, not JavaScript character count', () => {
    expect(() =>
      encodeEnrollmentTranscript(['a'.repeat(65_532)]),
    ).not.toThrow();
    expect(() => encodeEnrollmentTranscript(['a'.repeat(65_533)])).toThrow(
      DomainError,
    );
    expect(() => encodeEnrollmentTranscript(['ą'.repeat(32_767)])).toThrow(
      DomainError,
    );
  });
});
