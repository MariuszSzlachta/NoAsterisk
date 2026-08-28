import { ISO_DATE_PAD_CHAR } from '#features/csv-import/model/parsing/date-parser/formats/to-iso-date-string/constants/iso-date-pad-char';
import { ISO_DATE_PAD_LENGTH } from '#features/csv-import/model/parsing/date-parser/formats/to-iso-date-string/constants/iso-date-pad-length';

export const toIsoDateString = (
  year: number,
  month: number,
  day: number,
): string =>
  `${year}-${String(month).padStart(ISO_DATE_PAD_LENGTH, ISO_DATE_PAD_CHAR)}-${String(day).padStart(ISO_DATE_PAD_LENGTH, ISO_DATE_PAD_CHAR)}`;
