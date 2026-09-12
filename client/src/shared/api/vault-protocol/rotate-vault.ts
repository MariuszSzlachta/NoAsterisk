import { apiClient } from '#shared/api';

interface RotateVaultInput {
  readonly vaultId: string;
  readonly deviceId: string;
  readonly currentKeyId: string;
  readonly nextKeyId: string;
  readonly envelopePurpose: 'device-wrap' | 'passkey-wrap';
  readonly envelope: string;
  readonly passkeyEnvelope?: string;
  readonly idempotencyKey: string;
}

interface RotateVaultResponse {
  readonly status: 'rotated';
  readonly keyId: string;
  readonly revokedDeviceCount: number;
}

const isResponse = (value: unknown): value is RotateVaultResponse =>
  typeof value === 'object' &&
  value !== null &&
  'status' in value &&
  value.status === 'rotated' &&
  'keyId' in value &&
  typeof value.keyId === 'string' &&
  'revokedDeviceCount' in value &&
  typeof value.revokedDeviceCount === 'number' &&
  Number.isInteger(value.revokedDeviceCount) &&
  value.revokedDeviceCount >= 0;

const rotate = async (
  input: RotateVaultInput,
): Promise<RotateVaultResponse> => {
  if (
    input.vaultId.length === 0 ||
    input.deviceId.length === 0 ||
    input.currentKeyId.length === 0 ||
    input.nextKeyId.length === 0 ||
    input.idempotencyKey.length === 0 ||
    input.envelope.length === 0
    ||
    (input.passkeyEnvelope !== undefined && input.passkeyEnvelope.length === 0)
  )
    throw new Error('Invalid vault rotation input');
  const response = await apiClient.post<
    unknown,
    RotateVaultInput & { recoveryConfirmed: true }
  >('/users/me/vault/rotate', { ...input, recoveryConfirmed: true });
  if (!isResponse(response)) throw new Error('Invalid vault rotation response');
  return response;
};

export const rotateVault = Object.freeze({ rotate });
