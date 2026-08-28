import { CRLF_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/crlf.pattern';

export const normalizeCrlf = (text: string): string =>
  text.replace(CRLF_PATTERN, '\n');
