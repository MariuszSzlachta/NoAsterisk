import { CRLF_PATTERN } from './crlf-pattern';

export const normalizeCrlf = (text: string): string =>
  text.replace(CRLF_PATTERN, '\n');
