import { normalizeNbsp } from '#features/csv-import/model/parsing/shared/text-normalizers/normalize-nbsp';

export const normalizeWhitespace = (value: string): string =>
  normalizeNbsp(value).trim();
