import type { BankSignature } from '#features/csv-import/model/column-mapping/bank-signature';

export const SANTANDER_SIGNATURE: BankSignature = {
  displayName: 'Santander',
  headerPatterns: [
    [
      'data operacji',
      'data księgowania',
      'tytuł operacji',
      'kwota operacji',
      'waluta',
    ],
    ['data operacji', 'opis', 'kwota', 'waluta', 'saldo'],
  ],
};
