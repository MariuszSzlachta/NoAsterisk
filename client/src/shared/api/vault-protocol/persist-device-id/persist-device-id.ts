import { enrollmentTranscriptFormat } from '#shared/adapters/vault-protocol/enrollment-transcript/constants';
import { VAULT_DEVICE_ID_STORAGE_KEY } from '#shared/api/vault-protocol/persist-device-id/constants';

export const persistVaultDeviceId = (deviceId: string): void => {
  if (
    deviceId.length === 0 ||
    deviceId.length > enrollmentTranscriptFormat.maxIdentifierLength ||
    typeof localStorage === 'undefined'
  )
    throw new Error('Device identity storage unavailable');
  localStorage.setItem(VAULT_DEVICE_ID_STORAGE_KEY, deviceId);
};
