// ═══════════════════════════════════════════════════════════════════
// Bank Profile Registry — Extensible bank signature detection
// ═══════════════════════════════════════════════════════════════════

interface BankSignature {
  readonly displayName: string;
  readonly headerPatterns: readonly (readonly string[])[];
}

/**
 * Built-in bank signatures for Polish bank CSV detection.
 */
const BUILTIN_SIGNATURES: readonly BankSignature[] = [
  {
    displayName: 'mBank',
    headerPatterns: [
      ['data operacji', 'opis operacji', 'kwota', 'saldo po operacji'],
      ['data księgowania', 'opis operacji', 'kwota', 'saldo po operacji'],
      ['data operacji', 'data księgowania', 'opis operacji', 'tytuł', 'kwota'],
    ],
  },
  {
    displayName: 'PKO BP',
    headerPatterns: [
      ['data operacji', 'data waluty', 'typ transakcji', 'kwota'],
      ['data zlecenia', 'data waluty', 'typ transakcji', 'kwota operacji'],
    ],
  },
  {
    displayName: 'ING',
    headerPatterns: [
      ['data transakcji', 'data księgowania', 'dane kontrahenta', 'tytuł', 'kwota transakcji'],
      ['data transakcji', 'dane kontrahenta', 'tytuł', 'kwota'],
    ],
  },
  {
    displayName: 'Santander',
    headerPatterns: [
      ['data operacji', 'data księgowania', 'tytuł operacji', 'kwota operacji', 'waluta'],
      ['data operacji', 'opis', 'kwota', 'waluta', 'saldo'],
    ],
  },
  {
    displayName: 'Millennium',
    headerPatterns: [
      ['data', 'opis', 'obciążenia', 'uznania', 'saldo'],
      ['data operacji', 'tytuł', 'obciążenia', 'uznania'],
    ],
  },
];

/**
 * Registry pattern — extensible collection of bank profile signatures.
 *
 * Detect which bank a CSV file originates from based on header patterns.
 * User can register additional profiles for banks not covered by builtins.
 */
export class BankProfileRegistry {
  private readonly signatures: BankSignature[];

  constructor(builtins: readonly BankSignature[] = BUILTIN_SIGNATURES) {
    this.signatures = [...builtins];
  }

  register(signature: BankSignature): void {
    this.signatures.push(signature);
  }

  detect(headers: readonly string[]): string | undefined {
    const normalizedHeaders = headers.map((h) =>
      h.toLowerCase().trim().replace(/^#+/, '').trim(),
    );

    for (const signature of this.signatures) {
      for (const pattern of signature.headerPatterns) {
        const isMatch = pattern.every((expected) =>
          normalizedHeaders.some((h) => h.includes(expected)),
        );
        if (isMatch) {
          return signature.displayName;
        }
      }
    }

    return undefined;
  }

  getAll(): readonly BankSignature[] {
    return this.signatures;
  }
}

/**
 * Default registry instance with all built-in bank signatures.
 */
export const defaultBankProfileRegistry = new BankProfileRegistry();

/**
 * Convenience function for detecting bank from headers using the default registry.
 */
export const detectBankFromHeaders = (
  headers: readonly string[],
): string | undefined => defaultBankProfileRegistry.detect(headers);
