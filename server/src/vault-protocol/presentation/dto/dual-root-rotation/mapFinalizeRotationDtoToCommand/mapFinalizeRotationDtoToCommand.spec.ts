import { buildVaultRotationTranscript } from '@vault-protocol/testing/buildVaultRotationTranscript';
import { mapRotationTranscriptToResponse } from '@vault-protocol/application/mappers/mapRotationTranscriptToResponse';
import { mapFinalizeRotationDtoToCommand } from '@vault-protocol/presentation/dto/dual-root-rotation/mapFinalizeRotationDtoToCommand';
import { signVaultRotation } from '@vault-protocol/testing/signVaultRotation';
import { buildVaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture';
describe('mapFinalizeRotationDtoToCommand', () => {
  it('should derive trusted user context and convert the exact ISO timestamp', () => {
    const transcript = buildVaultRotationTranscript();
    const command = signVaultRotation(transcript, buildVaultSignatureFixture());
    expect(
      mapFinalizeRotationDtoToCommand(command.user, {
        transcript: mapRotationTranscriptToResponse(transcript),
        deviceSignature: command.deviceSignature,
        recoverySignature: command.recoverySignature,
      }),
    ).toEqual(command);
  });
});
