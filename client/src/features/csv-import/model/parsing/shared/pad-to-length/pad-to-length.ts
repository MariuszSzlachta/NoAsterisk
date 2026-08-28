export const padToLength = (
  arr: readonly string[],
  targetLength: number,
  fill = '',
): readonly string[] =>
  arr.length >= targetLength
    ? arr
    : [...arr, ...Array<string>(targetLength - arr.length).fill(fill)];
