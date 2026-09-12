import { VAULT_DEVICE_ID_STORAGE_KEY } from '#shared/api/vault-protocol/persist-device-id/constants';

const create = (): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
};

const get = (): string => {
  const existing =
    typeof localStorage === 'undefined'
      ? null
      : localStorage.getItem(VAULT_DEVICE_ID_STORAGE_KEY);
  if (existing !== null && existing.length > 0) return existing;
  const deviceId = create();
  if (typeof localStorage !== 'undefined')
    localStorage.setItem(VAULT_DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
};

export const vaultDeviceId = Object.freeze({ get });
