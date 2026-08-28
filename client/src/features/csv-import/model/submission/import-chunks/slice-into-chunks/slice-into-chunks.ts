export const sliceIntoChunks = <TItem>(
  items: readonly TItem[],
  size: number,
): readonly (readonly TItem[])[] =>
  Array.from(
    { length: Math.ceil(items.length / size) },
    (_, index) => items.slice(index * size, (index + 1) * size),
  );
