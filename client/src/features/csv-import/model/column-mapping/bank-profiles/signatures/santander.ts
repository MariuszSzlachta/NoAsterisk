import type { BankSignature } from '../../types';

export const SANTANDER_SIGNATURE: BankSignature = {
  displayName: 'Santander',
  headerPatterns: [
    ['data operacji', 'data księgowania', 'tytuł operacji', 'kwota operacji', 'waluta'],
    ['data operacji', 'opis', 'kwota', 'waluta', 'saldo'],
  ],
};
