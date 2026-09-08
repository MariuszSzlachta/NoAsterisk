import type { RowStatus } from '#features/csv-import/model/transformation/types/row-status';

/** Statuses eligible to continue from review into local persistence. */
export const IMPORTABLE_ROW_STATUSES: ReadonlyArray<RowStatus> = ['ok', 'warning'];
