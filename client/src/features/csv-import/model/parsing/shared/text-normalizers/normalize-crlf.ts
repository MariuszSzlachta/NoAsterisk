import { CRLF_PATTERN } from '../patterns';

export const normalizeCrlf = (text: string): string =>
  text.replace(CRLF_PATTERN, '\n');
