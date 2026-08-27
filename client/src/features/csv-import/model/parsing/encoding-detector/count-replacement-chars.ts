import { REPLACEMENT_CHAR } from '#features/csv-import/model/parsing/shared';

export const countReplacementChars = (text: string): number =>
  text.split(REPLACEMENT_CHAR).length - 1;
