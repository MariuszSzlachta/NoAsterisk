import { isHeaderLine } from './is-header-line';

export const classifyHeader = (
  lines: readonly string[],
  candidate: number | null,
  separator: string,
): number | null => {
  if (candidate === null) {
    return null;
  }

  const candidateLine = lines[candidate] ?? '';
  if (isHeaderLine(candidateLine, separator)) {
    return candidate;
  }

  const deeperSearch = lines
    .slice(0, candidate)
    .map((line, i) => ({ line, index: i }))
    .filter(
      ({ line }) => line.trim().length > 0 && isHeaderLine(line, separator),
    );

  return deeperSearch.length > 0
    ? deeperSearch[deeperSearch.length - 1]!.index
    : null;
};
