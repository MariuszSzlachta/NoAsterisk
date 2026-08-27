import type {
  NumericFormatDef,
  ParseableDateFormat,
} from '#features/csv-import/model/parsing/types';

export const createNumericParser = (
  def: NumericFormatDef,
): ParseableDateFormat => ({
  format: def.format,
  regex: def.regex,
  parse: (m) => {
    const y = m[def.groups.year];
    const mo = m[def.groups.month];
    const d = m[def.groups.day];
    if (y === undefined || mo === undefined || d === undefined) {
      return null;
    }
    const year = def.yearResolver ? def.yearResolver(y) : +y;
    if (year === null) {
      return null;
    }
    return { year, month: +mo, day: +d };
  },
});
