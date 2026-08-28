import { ENCODING_ISO_8859_2 } from '#features/csv-import/model/parsing/encoding-detector/constants/encoding-iso-8859-2';
import { ENCODING_UTF8 } from '#features/csv-import/model/parsing/encoding-detector/constants/encoding-utf8';
import { ENCODING_WINDOWS_1250 } from '#features/csv-import/model/parsing/encoding-detector/constants/encoding-windows-1250';
import { ENCODING_SEPARATOR_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/encoding-separator.pattern';

import { ASCII_IDENTIFIERS } from '#features/csv-import/model/parsing/encoding-detector/helpers/normalize-encoding/constants/ascii-identifiers';
import { ISO88592_IDENTIFIERS } from '#features/csv-import/model/parsing/encoding-detector/helpers/normalize-encoding/constants/iso88592-identifiers';
import { UTF8_IDENTIFIERS } from '#features/csv-import/model/parsing/encoding-detector/helpers/normalize-encoding/constants/utf8-identifiers';
import { WIN1250_IDENTIFIERS } from '#features/csv-import/model/parsing/encoding-detector/helpers/normalize-encoding/constants/win1250-identifiers';
import { WIN1252_IDENTIFIERS } from '#features/csv-import/model/parsing/encoding-detector/helpers/normalize-encoding/constants/win1252-identifiers';

export const normalizeEncoding = (detected: string): string => {
  const lower = detected.toLowerCase().replace(ENCODING_SEPARATOR_PATTERN, '');

  if (WIN1250_IDENTIFIERS.some((id) => lower.includes(id) || lower === id)) {
    return ENCODING_WINDOWS_1250;
  }
  if (WIN1252_IDENTIFIERS.some((id) => lower.includes(id) || lower === id)) {
    return ENCODING_WINDOWS_1250;
  }
  if (ISO88592_IDENTIFIERS.some((id) => lower.includes(id) || lower === id)) {
    return ENCODING_ISO_8859_2;
  }
  if (ASCII_IDENTIFIERS.some((id) => lower === id)) {
    return ENCODING_UTF8;
  }
  if (UTF8_IDENTIFIERS.some((id) => lower.includes(id) || lower === id)) {
    return ENCODING_UTF8;
  }

  return detected.toLowerCase();
};
