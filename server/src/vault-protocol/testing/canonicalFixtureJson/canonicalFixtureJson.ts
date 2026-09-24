export const canonicalFixtureJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalFixtureJson);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalFixtureJson(entry)]),
  );
};
