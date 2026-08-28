export const toNormalizedSet = (
  items: readonly string[],
  transform: (s: string) => string,
): ReadonlySet<string> => new Set(items.map(transform));
