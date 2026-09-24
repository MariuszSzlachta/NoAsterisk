import { DATE_CHECK_FIELDS } from '#features/csv-import/model/parsing/data-boundary-detector/constants/date-check-fields';
import { isDateValue } from '#features/csv-import/model/parsing/data-boundary-detector/helpers/is-date-value';

export const selectDateAnchoredRows = (
  rows: readonly (readonly string[])[],
  hasDateAnchoredRows: boolean,
): readonly (readonly string[])[] =>
  hasDateAnchoredRows
    ? rows.filter((row) =>
        row.slice(0, DATE_CHECK_FIELDS).some((value) => isDateValue(value)),
      )
    : rows;
