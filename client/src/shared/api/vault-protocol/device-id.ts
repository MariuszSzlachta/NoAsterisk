const STORAGE_KEY = 'budgetflow:vault-v2:device-id';

const create = (): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const get = (): string => {
  const existing = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
  if (existing !== null && existing.length > 0) return existing;
  const deviceId = create();
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, deviceId);
  return deviceId;
};

export const vaultDeviceId = Object.freeze({ get });
