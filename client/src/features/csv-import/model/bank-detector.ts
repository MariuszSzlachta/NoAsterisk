// ─── Bank Detection from CSV Headers ─────────────────────────────
// Detects which bank a CSV file originates from based on header patterns.
// Returns the bank display name or undefined if no match.

interface BankSignature {
  readonly displayName: string;
  readonly headerPatterns: readonly (readonly string[])[];
}

const BANK_SIGNATURES: readonly BankSignature[] = [
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

export const detectBankFromHeaders = (
  headers: readonly string[],
): string | undefined => {
  const normalizedHeaders = headers.map((h) =>
    h.toLowerCase().trim().replace(/^#+/, '').trim(),
  );

  for (const signature of BANK_SIGNATURES) {
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
};
