import type { BankSignature } from '#features/csv-import/model/column-mapping/bank-signature';

export interface BankProfileRegistry {
  readonly detect: (headers: readonly string[]) => string | undefined;
  readonly register: (signature: BankSignature) => BankProfileRegistry;
  readonly getAll: () => readonly BankSignature[];
}
