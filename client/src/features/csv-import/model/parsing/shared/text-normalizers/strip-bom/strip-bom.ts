import { BOM } from '#features/csv-import/model/parsing/shared/constants';

export const stripBom = (text: string): string =>
  text.startsWith(BOM) ? text.slice(1) : text;
