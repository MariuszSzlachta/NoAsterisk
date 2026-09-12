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
  return metadata.data;
};
