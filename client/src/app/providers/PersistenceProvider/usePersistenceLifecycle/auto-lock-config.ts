/**
 * Development must never lock the local vault automatically.
 * Production requires an explicit opt-in through VITE_AUTO_LOCK_ENABLED.
 */
export const isAutoLockEnabled = (
  isDevelopment: boolean,
  configuredValue: string | undefined,
): boolean => !isDevelopment && configuredValue === 'true';
