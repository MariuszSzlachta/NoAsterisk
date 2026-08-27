export const matchesBom = (
  bytes: Uint8Array,
  bom: readonly number[],
): boolean => bom.every((b, i) => bytes[i] === b);
