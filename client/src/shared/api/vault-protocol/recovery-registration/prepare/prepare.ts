import { enrollmentTranscriptFormat } from '#shared/adapters/vault-protocol/enrollment-transcript/constants';
import { recoveryRegistrationSchema } from '#shared/adapters/vault-protocol/recovery-registration/schema';
import type { RecoveryRegistrationIntent } from '#shared/adapters/vault-protocol/recovery-registration/types';
import { apiClient } from '#shared/api';
import { RECOVERY_REGISTRATION_PATHS } from '#shared/api/vault-protocol/recovery-registration/constants';
import type { RecoveryRegistrationRequest } from '#shared/api/vault-protocol/recovery-registration/types';

export const prepareRecoveryRegistration = async (
  input: RecoveryRegistrationRequest,
  signal: AbortSignal,
): Promise<RecoveryRegistrationIntent> => {
  const response = await apiClient.post<unknown, object>(
    RECOVERY_REGISTRATION_PATHS.prepare,
    {
      vaultId: input.vaultId,
      keyId: input.keyId,
      deviceId: input.deviceId,
      recoveryPublicKey: input.recoveryPublicKey,
      recoveryConfirmed: true,
    },
    { signal },
  );
  const parsed = recoveryRegistrationSchema.safeParse(response);
  if (!parsed.success)
    throw new Error('Invalid recovery registration response');
  const intent = parsed.data;
  const expiresAt = Date.parse(intent.expiresAt);
  const now = Date.now();
  if (
    signal.aborted ||
    expiresAt <= now ||
    expiresAt > now + enrollmentTranscriptFormat.ttlMs ||
    intent.accountId !== input.accountId ||
    intent.workspaceId !== input.workspaceId ||
    intent.vaultId !== input.vaultId ||
    intent.keyId !== input.keyId ||
    intent.deviceId !== input.deviceId ||
    intent.recoveryPublicKey !== input.recoveryPublicKey
  )
    throw new Error('Recovery registration context mismatch');
  return intent;
};
