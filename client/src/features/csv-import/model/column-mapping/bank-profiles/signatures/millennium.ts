import type { BankSignature } from '#features/csv-import/model/column-mapping/types';

export const MILLENNIUM_SIGNATURE: BankSignature = {
  displayName: 'Millennium',
  headerPatterns: [
    ['data', 'opis', 'obciążenia', 'uznania', 'saldo'],
    ['data operacji', 'tytuł', 'obciążenia', 'uznania'],
  ],
};
