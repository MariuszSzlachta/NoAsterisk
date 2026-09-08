import { describe, expect, it } from 'vitest';

import { formatImportHistoryDate } from '#features/csv-import/model/history/format-import-history-date';

describe('formatImportHistoryDate', () => {
  it('formats a completion timestamp for the selected locale', () => {
    expect(
      formatImportHistoryDate('2026-09-08T10:00:00.000Z', 'en-US'),
    ).toContain('2026');
  });
});
