import type { ReassemblyConfig, ReassemblyStrategy } from '../../types';
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

export interface ResolvedStrategy {
  readonly strategy: ReassemblyStrategy;
  readonly config: ReassemblyConfig;
}

/**
 * Resolve which reassembly strategy to use based on header analysis and data sampling.
 *
 * Decision logic:
 * 1. If data rows have overflow AND we can identify the overflow column → OverflowMerge
 * 2. Otherwise → Direct (clean CSV)
 */
export const resolveStrategy = (
  headers: readonly string[],
  dataRows: readonly (readonly string[])[],
  separator: string,
): ResolvedStrategy => {
  const expectedColumnCount = headers.length;

  if (!hasOverflowRows(dataRows, expectedColumnCount)) {
    return {
      strategy: directStrategy,
      config: { expectedColumnCount, separator },
    };
  }

  const overflowColumnIndex = detectOverflowColumnIndex(headers);

  if (overflowColumnIndex === undefined) {
    // Overflow detected but can't identify which column — fall back to direct
    // (will truncate, but that's safer than guessing wrong column)
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
