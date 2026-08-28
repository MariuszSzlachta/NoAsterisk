import type { BankSignature } from '#features/csv-import/model/column-mapping/types';

export const MBANK_SIGNATURE: BankSignature = {
  displayName: 'mBank',
  headerPatterns: [
    ['data operacji', 'opis operacji', 'kwota', 'saldo po operacji'],
    ['data księgowania', 'opis operacji', 'kwota', 'saldo po operacji'],
    ['data operacji', 'data księgowania', 'opis operacji', 'tytuł', 'kwota'],
  ],
};
