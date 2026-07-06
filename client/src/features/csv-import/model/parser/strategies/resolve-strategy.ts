import type { ReassemblyConfig, ReassemblyStrategy } from '../../types';
import { anchorStrategy } from './anchor-strategy';
import { directStrategy } from './direct-strategy';
import { overflowMergeStrategy } from './overflow-merge-strategy';

/**
 * Known header keywords that indicate a description/overflow column.
 * Matched case-insensitively.
 */
const OVERFLOW_COLUMN_KEYWORDS = [
  'opis operacji',
  'opis',
  'description',
  'tytuł',
  'title',
  'szczegóły',
  'details',
  'treść',
];

/**
 * Detect which column index is likely to contain overflow (unescaped separators).
 * Returns undefined if no overflow column identified.
 */
const detectOverflowColumnIndex = (headers: readonly string[]): number | undefined => {
  for (let i = 0; i < headers.length; i++) {
    const normalized = (headers[i] ?? '').toLowerCase().replace(/^#/, '').trim();
    if (OVERFLOW_COLUMN_KEYWORDS.some((kw) => normalized.includes(kw))) {
      return i;
    }
  }
  return undefined;
};

/**
 * Sample first N data rows to check if overflow occurs.
 * If any row has more tokens than expected → overflow is happening.
 */
const hasOverflowRows = (
  dataRows: readonly (readonly string[])[],
  expectedColumnCount: number,
  sampleSize = 10,
): boolean => {
  const sample = dataRows.slice(0, sampleSize);
  return sample.some((row) => row.length > expectedColumnCount);
};

/**
 * Date pattern for anchor detection in data rows.
 */
const DATE_PATTERN = /^\d{2}[./-]\d{2}[./-]\d{2,4}$|^\d{4}-\d{2}-\d{2}$|^\d{2}-[A-ZĘÓĄŚŁŻŹĆŃa-ząćęłńóśźż]{3}-\d{4}$/;

/**
 * Amount pattern for anchor detection in data rows.
 * Matches: -180,62 PLN | 8 500,00 | -14.80 | +9 200,00 EUR
 */
const AMOUNT_PATTERN = /^[+-]?\d[\d\s]*[.,]\d{2}(\s*[A-Z]{3})?$/;

/**
 * Detect if data rows have consistent date anchors at start and amount anchors at end.
 * This indicates the anchor strategy is appropriate.
 */
const hasAnchorPattern = (
  dataRows: readonly (readonly string[])[],
  sampleSize = 10,
): boolean => {
  const sample = dataRows.slice(0, sampleSize);
  if (sample.length === 0) {
    return false;
  }

  let dateStartCount = 0;
  let amountEndCount = 0;

  for (const row of sample) {
    if (row.length < 4) {
      continue;
    }
    // Check if first token is a date
    if (DATE_PATTERN.test((row[0] ?? '').trim())) {
      dateStartCount++;
    }
    // Check if last or second-to-last token is an amount
    const lastIdx = row.length - 1;
    for (let i = lastIdx; i >= Math.max(0, lastIdx - 2); i--) {
      if (AMOUNT_PATTERN.test((row[i] ?? '').trim())) {
        amountEndCount++;
        break;
      }
    }
  }

  // ≥80% of rows should have date at start AND amount at end
  const threshold = sample.length * 0.8;
  return dateStartCount >= threshold && amountEndCount >= threshold;
};

export interface ResolvedStrategy {
  readonly strategy: ReassemblyStrategy;
  readonly config: ReassemblyConfig;
}

/**
 * Resolve which reassembly strategy to use based on header analysis and data sampling.
 *
 * Decision logic:
 * 1. If anchor pattern detected (dates at start, amounts at end) → Anchor
 *    (handles both overflow AND equal-count cases via pass-through)
 * 2. If no overflow rows → Direct (clean CSV)
 * 3. If overflow AND identifiable single overflow column → OverflowMerge (legacy)
 * 4. Otherwise → Direct (safe fallback)
 */
export const resolveStrategy = (
  headers: readonly string[],
  dataRows: readonly (readonly string[])[],
  separator: string,
): ResolvedStrategy => {
  const expectedColumnCount = headers.length;

  // Check anchor FIRST — it handles both overflow and equal-count cases correctly
  if (hasAnchorPattern(dataRows)) {
    return {
      strategy: anchorStrategy,
      config: { expectedColumnCount, separator },
    };
  }

  if (!hasOverflowRows(dataRows, expectedColumnCount)) {
    return {
      strategy: directStrategy,
      config: { expectedColumnCount, separator },
    };
  }

  const overflowColumnIndex = detectOverflowColumnIndex(headers);

  if (overflowColumnIndex === undefined) {
    return {
      strategy: directStrategy,
      config: { expectedColumnCount, separator },
    };
  }

  const fixedTailColumns = expectedColumnCount - overflowColumnIndex - 1;

  return {
    strategy: overflowMergeStrategy,
    config: {
      expectedColumnCount,
      separator,
      overflowColumnIndex,
      fixedTailColumns,
    },
  };
};
