import { apiClient } from '#shared/api';
import { vaultDeviceId } from '#shared/api/vault-protocol/device-id';
import { vaultBootstrapContract } from '#shared/api/vault-protocol/get-vault-bootstrap/constants';
import { vaultBootstrapSchema } from '#shared/api/vault-protocol/get-vault-bootstrap/schema';
import type { VaultBootstrapMetadata } from '#shared/api/vault-protocol/get-vault-bootstrap/types';

export const getVaultBootstrap = async (
  signal?: AbortSignal,
): Promise<VaultBootstrapMetadata> => {
  const deviceId = vaultDeviceId.get();
  const response = await apiClient.get<unknown>(
    `${vaultBootstrapContract.path}?deviceId=${encodeURIComponent(deviceId)}`,
    signal === undefined ? undefined : { signal },
  );
  const metadata = vaultBootstrapSchema.safeParse(response);
  if (
    signal?.aborted === true ||
    !metadata.success ||
    metadata.data.deviceId !== deviceId
  )
    throw new Error('Invalid vault bootstrap response');
  if (metadata.data.status !== 'available') return metadata.data;
  if (metadata.data.deviceEnvelope !== undefined) {
    const { deviceEnvelope, passkeyEnvelope, ...identity } = metadata.data;
    return passkeyEnvelope === undefined
      ? { ...identity, deviceEnvelope }
      : { ...identity, deviceEnvelope, passkeyEnvelope };
  }
  if (metadata.data.passkeyEnvelope !== undefined) {
    const {
      passkeyEnvelope,
      deviceEnvelope: _deviceEnvelope,
      ...identity
    } = metadata.data;
    return { ...identity, passkeyEnvelope };
  }
  throw new Error('Invalid vault bootstrap response');
};
