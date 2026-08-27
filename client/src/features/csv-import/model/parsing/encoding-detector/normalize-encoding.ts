import { ENCODING_SEPARATOR_PATTERN } from '#features/csv-import/model/parsing/shared';

export const normalizeEncoding = (detected: string): string => {
  const lower = detected.toLowerCase().replace(ENCODING_SEPARATOR_PATTERN, '');
  if (lower.includes('1250') || lower === 'windows1250') {
    return 'windows-1250';
  }
  if (lower.includes('1252') || lower === 'windows1252') {
    return 'windows-1250';
  } // PL-focused: Polish bank CSVs mislabeled as 1252 by jschardet
  if (lower.includes('88592') || lower === 'iso88592' || lower === 'latin2') {
    return 'iso-8859-2';
  }
  if (lower === 'ascii' || lower === 'usascii') {
    return 'utf-8';
  }
  if (lower.includes('utf8') || lower === 'utf8') {
    return 'utf-8';
  }
  return detected.toLowerCase();
};
