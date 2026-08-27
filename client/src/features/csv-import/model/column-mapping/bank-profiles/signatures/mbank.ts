import type { BankSignature } from '../../types';

export const MBANK_SIGNATURE: BankSignature = {
  displayName: 'mBank',
  headerPatterns: [
    ['data operacji', 'opis operacji', 'kwota', 'saldo po operacji'],
    ['data księgowania', 'opis operacji', 'kwota', 'saldo po operacji'],
    ['data operacji', 'data księgowania', 'opis operacji', 'tytuł', 'kwota'],
  ],
};
