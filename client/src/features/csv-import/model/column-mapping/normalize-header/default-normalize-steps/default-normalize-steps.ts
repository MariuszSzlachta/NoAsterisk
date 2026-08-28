import type { NormalizeStep } from '#features/csv-import/model/column-mapping/normalize-step';
import { collapseWhitespace } from '#features/csv-import/model/column-mapping/normalize-header/collapse-whitespace';
import { stripBom } from '#features/csv-import/model/column-mapping/normalize-header/strip-bom-step';
import { stripLeadingHash } from '#features/csv-import/model/column-mapping/normalize-header/strip-leading-hash';
import { stripParenthetical } from '#features/csv-import/model/column-mapping/normalize-header/strip-parenthetical';
import { stripSurroundingQuotes } from '#features/csv-import/model/column-mapping/normalize-header/strip-surrounding-quotes';
import { toLower } from '#features/csv-import/model/column-mapping/normalize-header/to-lower';

export const DEFAULT_NORMALIZE_STEPS: readonly NormalizeStep[] = [
  stripBom,
  stripLeadingHash,
  stripSurroundingQuotes,
  stripParenthetical,
  collapseWhitespace,
  toLower,
];
