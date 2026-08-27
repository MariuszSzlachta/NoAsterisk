import type { BankSignature } from '../../types';

export const PKO_BP_SIGNATURE: BankSignature = {
  displayName: 'PKO BP',
  headerPatterns: [
    ['data operacji', 'data waluty', 'typ transakcji', 'kwota'],
    ['data zlecenia', 'data waluty', 'typ transakcji', 'kwota operacji'],
  ],
};
