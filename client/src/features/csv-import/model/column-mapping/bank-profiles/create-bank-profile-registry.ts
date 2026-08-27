import type { BankProfileRegistry, BankSignature } from '../types';
import { normalizeHeader } from '../normalize-header';
import { BUILTIN_SIGNATURES } from './signatures';

const matchesPattern = (
  normalizedHeaders: readonly string[],
  pattern: readonly string[],
): boolean =>
  pattern.every((expected) => normalizedHeaders.some((h) => h.includes(expected)));

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
