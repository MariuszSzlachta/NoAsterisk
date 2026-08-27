import type { ColumnMapping, DomainField } from '../types';

/** Minimum viable mapping: date + title + (amount OR debit/credit). */
export const hasRequiredFields = (mapping: ColumnMapping): boolean => {
  const fields = Object.values(mapping).filter(Boolean) as DomainField[];
  const hasDate = fields.includes('date');
  const hasTitle = fields.includes('title');
  const hasAmount = fields.includes('amount') || fields.includes('debit') || fields.includes('credit');
  return hasDate && hasTitle && hasAmount;
};
