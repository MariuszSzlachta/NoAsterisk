import { isRecord } from '#shared/lib/is-record';

export const getLegacyRecordId = (record: object): string => {
  if (
    isRecord(record) &&
    typeof record.id === 'string' &&
    record.id.length > 0
  ) {
    return record.id;
  }
  throw new Error('Legacy record is missing an id');
};
