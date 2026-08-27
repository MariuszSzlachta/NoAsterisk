import { BOM } from './bom';

export const stripBom = (text: string): string =>
  text.startsWith(BOM) ? text.slice(1) : text;
