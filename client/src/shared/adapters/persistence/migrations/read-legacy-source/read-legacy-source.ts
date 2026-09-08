import { isRecord } from '#shared/lib/is-record';
import type { LegacySource, ValidatedLegacySource } from '#shared/adapters/persistence/migrations/legacy-types';

export const readLegacySource = (
  source: LegacySource,
): ValidatedLegacySource | 'absent' | 'invalid' => {
  let raw: string | null;
  try {
    raw = localStorage.getItem(source.key);
  } catch {
    return 'invalid';
  }
  if (raw === null) {
    return 'absent';
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return 'invalid';
  }

  if (!isRecord(parsed) || !isRecord(parsed.state)) {
    return 'invalid';
  }
  const rawRecords = parsed.state[source.stateField];
  if (!Array.isArray(rawRecords) || !rawRecords.every(source.validator)) {
    return 'invalid';
  }
  return { source, records: rawRecords };
};
