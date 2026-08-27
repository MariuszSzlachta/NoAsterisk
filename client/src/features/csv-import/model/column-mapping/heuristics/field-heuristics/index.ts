import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/types';
import { AMOUNT_HEURISTICS } from './amount';
import { BALANCE_HEURISTICS } from './balance';
import { CATEGORY_HEURISTICS } from './category';
import { COUNTERPART_HEURISTICS } from './counterpart';
import { CURRENCY_HEURISTICS } from './currency';
import { DATE_HEURISTICS } from './date';
import { DEBIT_CREDIT_HEURISTICS } from './debit-credit';
import { RECIPIENT_HEURISTICS } from './recipient';
import { REFERENCE_HEURISTICS } from './reference';
import { SOURCE_HEURISTICS } from './source';
import { TITLE_HEURISTICS } from './title';

export const BUILTIN_HEURISTICS: readonly HeaderHeuristic[] = [
  ...DATE_HEURISTICS,
  ...TITLE_HEURISTICS,
  ...AMOUNT_HEURISTICS,
  ...CURRENCY_HEURISTICS,
  ...BALANCE_HEURISTICS,
  ...DEBIT_CREDIT_HEURISTICS,
  ...CATEGORY_HEURISTICS,
  ...SOURCE_HEURISTICS,
  ...RECIPIENT_HEURISTICS,
  ...COUNTERPART_HEURISTICS,
  ...REFERENCE_HEURISTICS,
];
