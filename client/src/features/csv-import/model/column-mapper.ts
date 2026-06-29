import type { ColumnMapping, DomainField } from './types';

const HEADER_HEURISTICS: Record<string, DomainField> = {
  'data operacji': 'date',
  'data transakcji': 'date',
  'data księgowania': 'date',
  data: 'date',
  'opis operacji': 'title',
  'tytuł operacji': 'title',
  tytuł: 'title',
  opis: 'title',
  kwota: 'amount',
  'kwota operacji': 'amount',
  wartość: 'amount',
  waluta: 'currency',
  'saldo po operacji': 'balance',
  'saldo końcowe': 'balance',
  saldo: 'balance',
};

export const autoDetectMapping = (
  headers: readonly string[],
): ColumnMapping => {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<DomainField>();

  for (const header of headers) {
    const normalized = header.toLowerCase().trim();
    const field = HEADER_HEURISTICS[normalized];
    if (field && !usedFields.has(field)) {
      mapping[header] = field;
      usedFields.add(field);
    }
  }
  return mapping;
};
