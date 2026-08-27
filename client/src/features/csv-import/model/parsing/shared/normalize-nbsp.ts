import { NBSP } from './nbsp';

export const normalizeNbsp = (text: string): string =>
  text.replace(new RegExp(NBSP, 'g'), ' ');
