import { BOM } from '../constants';

export const stripBom = (text: string): string =>
  text.startsWith(BOM) ? text.slice(1) : text;
