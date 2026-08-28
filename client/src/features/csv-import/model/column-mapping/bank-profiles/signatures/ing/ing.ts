import type { BankSignature } from '#features/csv-import/model/column-mapping/types';

export const ING_SIGNATURE: BankSignature = {
  displayName: 'ING',
  headerPatterns: [
    [
      'data transakcji',
      'data księgowania',
      'dane kontrahenta',
      'tytuł',
      'kwota transakcji',
    ],
    ['data transakcji', 'dane kontrahenta', 'tytuł', 'kwota'],
  ],
};
