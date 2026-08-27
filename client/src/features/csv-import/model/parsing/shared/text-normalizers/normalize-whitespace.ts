import { normalizeNbsp } from './normalize-nbsp';

export const normalizeWhitespace = (value: string): string =>
  normalizeNbsp(value).trim();
