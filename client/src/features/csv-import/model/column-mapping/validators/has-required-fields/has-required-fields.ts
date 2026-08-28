import type { ColumnMapping } from '#features/csv-import/model/column-mapping/column-mapping-type';
import { REQUIRED_FIELDS } from '#features/csv-import/model/column-mapping/validators/required-fields';

export const hasRequiredFields = (mapping: ColumnMapping): boolean => {
  const fields = Object.values(mapping).filter(Boolean);
  const hasDate = fields.includes(REQUIRED_FIELDS.DATE);
  const hasTitle = fields.includes(REQUIRED_FIELDS.TITLE);
  const hasAmount =
    fields.includes(REQUIRED_FIELDS.AMOUNT) ||
    fields.includes(REQUIRED_FIELDS.DEBIT) ||
    fields.includes(REQUIRED_FIELDS.CREDIT);
  return hasDate && hasTitle && hasAmount;
};
