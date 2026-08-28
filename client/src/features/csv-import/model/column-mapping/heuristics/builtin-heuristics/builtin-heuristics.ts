import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/header-heuristic';
import { AMOUNT_HEURISTICS } from '#features/csv-import/model/column-mapping/heuristics/field-heuristics/amount';
import { BALANCE_HEURISTICS } from '#features/csv-import/model/column-mapping/heuristics/field-heuristics/balance';
import { CATEGORY_HEURISTICS } from '#features/csv-import/model/column-mapping/heuristics/field-heuristics/category';
import { COUNTERPART_HEURISTICS } from '#features/csv-import/model/column-mapping/heuristics/field-heuristics/counterpart';
import { CURRENCY_HEURISTICS } from '#features/csv-import/model/column-mapping/heuristics/field-heuristics/currency';
import { DATE_HEURISTICS } from '#features/csv-import/model/column-mapping/heuristics/field-heuristics/date';
import { DEBIT_CREDIT_HEURISTICS } from '#features/csv-import/model/column-mapping/heuristics/field-heuristics/debit-credit';
import { RECIPIENT_HEURISTICS } from '#features/csv-import/model/column-mapping/heuristics/field-heuristics/recipient';
import { REFERENCE_HEURISTICS } from '#features/csv-import/model/column-mapping/heuristics/field-heuristics/reference';
import { SOURCE_HEURISTICS } from '#features/csv-import/model/column-mapping/heuristics/field-heuristics/source';
import { TITLE_HEURISTICS } from '#features/csv-import/model/column-mapping/heuristics/field-heuristics/title';

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
