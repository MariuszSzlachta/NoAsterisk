export const findMode = (
  values: readonly number[],
): { count: number; frequency: number } => {
  const freq = values.reduce<ReadonlyMap<number, number>>(
    (map, c) => new Map([...map, [c, (map.get(c) ?? 0) + 1]]),
    new Map(),
  );

  return Array.from(freq.entries()).reduce(
    (best, [count, frequency]) =>
      frequency > best.frequency ||
      (frequency === best.frequency && count > best.count)
        ? { count, frequency }
        : best,
    { count: 0, frequency: 0 },
  );
};
