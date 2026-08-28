import { matchesPattern } from '#features/csv-import/model/column-mapping/bank-profiles/matches-pattern';
import { BUILTIN_SIGNATURES } from '#features/csv-import/model/column-mapping/bank-profiles/signatures';
import { normalizeHeader } from '#features/csv-import/model/column-mapping/normalize-header';
import type { BankProfileRegistry } from '#features/csv-import/model/column-mapping/bank-profile-registry';
import type { BankSignature } from '#features/csv-import/model/column-mapping/bank-signature';

export const createBankProfileRegistry = (
  signatures: readonly BankSignature[] = BUILTIN_SIGNATURES,
): BankProfileRegistry => ({
  detect: (headers: readonly string[]): string | undefined => {
    const normalized = headers.map((h) => normalizeHeader(h));
    return signatures.find((sig) =>
      sig.headerPatterns.some((pattern) => matchesPattern(normalized, pattern)),
    )?.displayName;
  },

  register: (signature: BankSignature): BankProfileRegistry =>
    createBankProfileRegistry([...signatures, signature]),

  getAll: (): readonly BankSignature[] => signatures,
});
