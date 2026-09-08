const hasString = (record: Record<string, unknown>, key: string): boolean =>
  typeof record[key] === 'string';

const hasFiniteNumber = (record: Record<string, unknown>, key: string): boolean =>
  typeof record[key] === 'number' && Number.isFinite(record[key]);

const isOptionalString = (record: Record<string, unknown>, key: string): boolean =>
  record[key] === undefined || typeof record[key] === 'string';

const isStringMap = (value: unknown): value is Readonly<Record<string, string>> =>
  isRecordValue(value) && Object.values(value).every((entry) => typeof entry === 'string');

const isRecordValue = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const recordGuards = {
  hasFiniteNumber,
  hasString,
  isOptionalString,
  isStringMap,
};
