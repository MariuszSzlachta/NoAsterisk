import { isRecord } from '#shared/lib/is-record';

export const getPersistenceRecordId = (record: object): string => {
  if (
    isRecord(record) &&
    typeof record.id === 'string' &&
    record.id.length > 0
  ) {
    return record.id;
  }

  throw new Error('Encrypted collection record is missing an id');
};
