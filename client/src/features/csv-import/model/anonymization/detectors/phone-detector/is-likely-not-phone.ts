export const isLikelyNotPhone = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 20), start).toLowerCase();

  const exclusionPatterns: readonly RegExp[] = [
    /(?:fv|faktura|nr|numer|zamówienie|id|ref)[/\s:-]*$/i,
    /blk\d*$/i,
    /(?:polis[ya]|polisy)\b/i,
    /ref[/\s:-]*$/i,
    /(?:autoryzacja|auth)[/\s:-]*$/i,
  ];

  if (exclusionPatterns.some((pattern) => pattern.test(prefix))) {
    return true;
  }

  return start > 0 && /[A-Za-z/]$/.test(text.slice(start - 1, start));
};
