import { NBSP } from '../constants';

export const normalizeNbsp = (text: string): string =>
  text.replace(new RegExp(NBSP, 'g'), ' ');
