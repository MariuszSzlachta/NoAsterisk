export const countTrailingEmptiesInRow = (arr: readonly string[]): number => {
  const idx = [...arr].reverse().findIndex((s) => s !== '');
  return idx === -1 ? arr.length : idx;
};
