import { defaultBankProfileRegistry } from './default-bank-profile-registry';

export const detectBankFromHeaders = (
  headers: readonly string[],
): string | undefined => defaultBankProfileRegistry.detect(headers);
