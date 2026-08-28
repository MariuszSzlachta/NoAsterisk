export const EXCLUSION_PATTERNS: readonly RegExp[] = [
  /(?:fv|faktura|nr|numer|zamówienie|id|ref)[/\s:-]*$/i,
  /blk\d*$/i,
  /(?:polis[ya]|polisy)\b/i,
  /ref[/\s:-]*$/i,
  /(?:autoryzacja|auth)[/\s:-]*$/i,
];
