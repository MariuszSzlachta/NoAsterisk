import type { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
export type SignedEnrollmentTransaction = Parameters<
  Parameters<DrizzleDatabase['transaction']>[0]
>[0];
