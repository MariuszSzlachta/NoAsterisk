import type { BankSignature } from '../../types';
import { ING_SIGNATURE } from './ing';
import { MBANK_SIGNATURE } from './mbank';
import { MILLENNIUM_SIGNATURE } from './millennium';
import { PKO_BP_SIGNATURE } from './pko-bp';
import { SANTANDER_SIGNATURE } from './santander';

export const BUILTIN_SIGNATURES: readonly BankSignature[] = [
  MBANK_SIGNATURE,
  PKO_BP_SIGNATURE,
  ING_SIGNATURE,
  SANTANDER_SIGNATURE,
  MILLENNIUM_SIGNATURE,
];
