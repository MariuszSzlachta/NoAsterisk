import { NBSP } from '#features/csv-import/model/parsing/shared/constants/nbsp';

export const normalizeNbsp = (text: string): string =>
  text.replace(new RegExp(NBSP, 'g'), ' ');
