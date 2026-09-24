import { anchorStrategy } from '#features/csv-import/model/parsing/strategies/anchor-strategy';
import { directStrategy } from '#features/csv-import/model/parsing/strategies/direct-strategy';
import { detectOverflowColumnIndex } from '#features/csv-import/model/parsing/strategies/helpers/detect-overflow-column-index';
import { hasAnchorPattern } from '#features/csv-import/model/parsing/strategies/helpers/has-anchor-pattern';
import { hasOverflowRows } from '#features/csv-import/model/parsing/strategies/helpers/has-overflow-rows';
import { overflowMergeStrategy } from '#features/csv-import/model/parsing/strategies/overflow-merge-strategy';
import type { ResolvedStrategy } from '#features/csv-import/model/parsing/types/resolved-strategy';

const COMBINING_MARK_PATTERN = /\p{M}/gu;
const MONETARY_HEADER_PATTERN =
  /amount|balance|kwota|saldo|debit|credit|fee|borc|alacak|bakiye|so du|so tien/;

const hasMonetaryTail = (headers: readonly string[]): boolean => {
  const tail = headers.at(-1) ?? '';
  const normalized = tail
    .normalize('NFKD')
    .replace(COMBINING_MARK_PATTERN, '')
    .toLowerCase();
  return MONETARY_HEADER_PATTERN.test(normalized);
};

export const resolveStrategy = (
  headers: readonly string[],
  dataRows: readonly (readonly string[])[],
  separator: string,
): ResolvedStrategy => {
  const expectedColumnCount = headers.length;
  const hasOverflow = hasOverflowRows(
    dataRows,
    expectedColumnCount,
    dataRows.length,
  );
  const overflowColumnIndex = detectOverflowColumnIndex(headers);

  if (
    hasOverflow &&
    overflowColumnIndex !== undefined &&
    !hasMonetaryTail(headers)
  ) {
    return {
      strategy: overflowMergeStrategy,
      config: {
        expectedColumnCount,
        separator,
        overflowColumnIndex,
        fixedTailColumns: expectedColumnCount - overflowColumnIndex - 1,
      },
    };
  }

  if (hasAnchorPattern(dataRows)) {
    return {
      strategy: anchorStrategy,
      config: { expectedColumnCount, separator },
    };
  }

  if (!hasOverflow) {
    return {
      strategy: directStrategy,
      config: { expectedColumnCount, separator },
    };
  }

  if (overflowColumnIndex !== undefined) {
    return {
      strategy: overflowMergeStrategy,
      config: {
        expectedColumnCount,
        separator,
        overflowColumnIndex,
        fixedTailColumns: expectedColumnCount - overflowColumnIndex - 1,
      },
    };
  }

  return {
    strategy: directStrategy,
    config: { expectedColumnCount, separator },
  };
};
