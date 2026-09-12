import { apiClient } from '#shared/api';

interface VaultDevice {
  readonly deviceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly status: string;
  readonly createdAt: string;
  readonly lastSeenAt: string;
  readonly signingPublicKey?: string;
  readonly revokedAt?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isDevice = (value: unknown): value is VaultDevice =>
  isRecord(value) &&
  typeof value.deviceId === 'string' &&
  typeof value.vaultId === 'string' &&
  typeof value.keyId === 'string' &&
  typeof value.status === 'string' &&
  typeof value.createdAt === 'string' &&
  typeof value.lastSeenAt === 'string' &&
  (value.signingPublicKey === undefined || typeof value.signingPublicKey === 'string') &&
  (value.revokedAt === undefined || typeof value.revokedAt === 'string');

const list = async (): Promise<ReadonlyArray<VaultDevice>> => {
  const response = await apiClient.get<unknown>('/users/me/vault/devices');
  if (!Array.isArray(response) || !response.every(isDevice))
    throw new Error('Invalid vault devices response');
  return response;
};

const revoke = async (deviceId: string): Promise<void> => {
  if (deviceId.length === 0 || deviceId.length > 128)
    throw new Error('Invalid device ID');
  await apiClient.post(
    `/users/me/vault/devices/${encodeURIComponent(deviceId)}/revoke`,
    {},
  );
};

export const vaultDevices = Object.freeze({ list, revoke });
