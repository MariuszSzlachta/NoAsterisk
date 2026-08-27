/**
 * Normalize whitespace after masking: replace tabs, collapse multi-spaces, trim.
 */
export const normalizeWhitespace = (text: string): string =>
  text.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();
