import { isRotationDtoWithinLimit } from '@vault-protocol/presentation/dto/dual-root-rotation/isRotationDtoWithinLimit';
import { buildVaultRotationTranscript } from '@vault-protocol/testing/buildVaultRotationTranscript';
import { mapRotationTranscriptToResponse } from '@vault-protocol/application/mappers/mapRotationTranscriptToResponse';
describe('isRotationDtoWithinLimit', () => {
  it('should reject combined UTF8 transcript bytes beyond the canonical limit', () => {
    const input = mapRotationTranscriptToResponse(
      buildVaultRotationTranscript(),
    );
    expect(isRotationDtoWithinLimit(input)).toBe(true);
    expect(
      isRotationDtoWithinLimit({ ...input, envelope: 'ą'.repeat(33_000) }),
    ).toBe(false);
  });
});
