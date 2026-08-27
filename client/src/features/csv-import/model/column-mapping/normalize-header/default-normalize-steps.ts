import type { NormalizeStep } from '#features/csv-import/model/column-mapping/types';
import { collapseWhitespace } from './collapse-whitespace';
import { stripBom } from './strip-bom-step';
import { stripLeadingHash } from './strip-leading-hash';
import { stripParenthetical } from './strip-parenthetical';
import { stripSurroundingQuotes } from './strip-surrounding-quotes';
import { toLower } from './to-lower';

export const DEFAULT_NORMALIZE_STEPS: readonly NormalizeStep[] = [
  stripBom,
  stripLeadingHash,
  stripSurroundingQuotes,
  stripParenthetical,
  collapseWhitespace,
  toLower,
];
