import { REPLACEMENT_CHAR } from '../shared/constants';

export const countReplacementChars = (text: string): number =>
  text.split(REPLACEMENT_CHAR).length - 1;
