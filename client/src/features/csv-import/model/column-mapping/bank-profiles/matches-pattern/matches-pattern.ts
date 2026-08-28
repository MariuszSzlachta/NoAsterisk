export const matchesPattern = (
  normalizedHeaders: readonly string[],
  pattern: readonly string[],
): boolean =>
  pattern.every((expected) =>
    normalizedHeaders.some((h) => h.includes(expected)),
  );
