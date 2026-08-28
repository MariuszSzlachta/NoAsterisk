import type { BankSignature } from '#features/csv-import/model/column-mapping/types';

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
