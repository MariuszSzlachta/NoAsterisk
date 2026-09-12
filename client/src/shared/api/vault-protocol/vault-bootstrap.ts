import { apiClient } from '#shared/api';
import { vaultDeviceId } from '#shared/api/vault-protocol/device-id';

interface VaultBootstrap {
  readonly status: 'empty' | 'enrollment-required' | 'available';
  readonly vaultId?: string;
  readonly keyId?: string;
  readonly deviceId: string;
  readonly protocolVersion: 2;
  readonly cryptoSuite: 'HKDF-SHA256/AES-256-GCM';
  readonly securityProfile?: 'standard' | 'high-security';
  readonly deviceEnvelope?: string;
  readonly passkeyEnvelope?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBootstrap = (value: unknown): value is VaultBootstrap => {
  if (!isRecord(value)) return false;
  const status = value.status;
  return (
    (status === 'empty' || status === 'enrollment-required' || status === 'available') &&
    typeof value.deviceId === 'string' &&
    value.protocolVersion === 2 &&
    value.cryptoSuite === 'HKDF-SHA256/AES-256-GCM' &&
    (value.vaultId === undefined || typeof value.vaultId === 'string') &&
    (value.keyId === undefined || typeof value.keyId === 'string') &&
    (value.securityProfile === undefined ||
      value.securityProfile === 'standard' ||
      value.securityProfile === 'high-security') &&
    (value.deviceEnvelope === undefined || typeof value.deviceEnvelope === 'string') &&
    (value.passkeyEnvelope === undefined || typeof value.passkeyEnvelope === 'string')
  );
};

const get = async (): Promise<VaultBootstrap> => {
  const deviceId = vaultDeviceId.get();
  const response = await apiClient.get<unknown>(
    `/users/me/vault/bootstrap?deviceId=${encodeURIComponent(deviceId)}`,
  );
  if (!isBootstrap(response) || response.deviceId !== deviceId)
    throw new Error('Invalid vault bootstrap response');
  return response;
};

export const vaultBootstrap = Object.freeze({ get });
