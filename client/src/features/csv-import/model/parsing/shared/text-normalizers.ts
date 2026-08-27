import { BOM, NBSP } from './constants';
import { CRLF_PATTERN } from './patterns';

export const stripBom = (text: string): string =>
  text.startsWith(BOM) ? text.slice(1) : text;

export const normalizeCrlf = (text: string): string =>
  text.replace(CRLF_PATTERN, '\n');

export const normalizeNbsp = (text: string): string =>
  text.replace(new RegExp(NBSP, 'g'), ' ');

export const normalizeWhitespace = (value: string): string =>
  normalizeNbsp(value).trim();
