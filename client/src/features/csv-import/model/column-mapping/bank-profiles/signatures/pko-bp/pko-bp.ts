import type { BankSignature } from '#features/csv-import/model/column-mapping/bank-signature';

export const PKO_BP_SIGNATURE: BankSignature = {
  displayName: 'PKO BP',
  headerPatterns: [
    ['data operacji', 'data waluty', 'typ transakcji', 'kwota'],
    ['data zlecenia', 'data waluty', 'typ transakcji', 'kwota operacji'],
  ],
};
