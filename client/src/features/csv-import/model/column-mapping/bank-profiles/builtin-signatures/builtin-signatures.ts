import type { BankSignature } from '#features/csv-import/model/column-mapping/types';
import { ING_SIGNATURE } from '#features/csv-import/model/column-mapping/bank-profiles/signatures/ing';
import { MBANK_SIGNATURE } from '#features/csv-import/model/column-mapping/bank-profiles/signatures/mbank';
import { MILLENNIUM_SIGNATURE } from '#features/csv-import/model/column-mapping/bank-profiles/signatures/millennium';
import { PKO_BP_SIGNATURE } from '#features/csv-import/model/column-mapping/bank-profiles/signatures/pko-bp';
import { SANTANDER_SIGNATURE } from '#features/csv-import/model/column-mapping/bank-profiles/signatures/santander';

export const BUILTIN_SIGNATURES: readonly BankSignature[] = [
  MBANK_SIGNATURE,
  PKO_BP_SIGNATURE,
  ING_SIGNATURE,
  SANTANDER_SIGNATURE,
  MILLENNIUM_SIGNATURE,
];
