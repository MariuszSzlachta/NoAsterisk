import type { CurrentUserPayload } from '@shared/auth/current-user';
import type { FinalizeDualRootRotationCommand } from '@vault-protocol/application/commands/finalize-dual-root-rotation/types';
import type { FinalizeRotationDto } from '@vault-protocol/presentation/dto/dual-root-rotation/types';

export const mapFinalizeRotationDtoToCommand = (
  user: CurrentUserPayload,
  dto: FinalizeRotationDto,
): FinalizeDualRootRotationCommand => ({
  user,
  transcript: {
    ...dto.transcript,
    expiresAt: Date.parse(dto.transcript.expiresAt),
  },
  deviceSignature: dto.deviceSignature,
  recoverySignature: dto.recoverySignature,
});
