import { defaultBankProfileRegistry } from '#features/csv-import/model/column-mapping/bank-profiles/default-bank-profile-registry';

export const detectBankFromHeaders = (
  headers: readonly string[],
): string | undefined => defaultBankProfileRegistry.detect(headers);
