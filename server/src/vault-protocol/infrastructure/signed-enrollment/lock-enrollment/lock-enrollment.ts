import { sql } from 'drizzle-orm';
import type { EnrollmentTranscriptScope } from '@vault-protocol/domain/value-objects/enrollment-transcript';
import type { SignedEnrollmentTransaction } from '@vault-protocol/infrastructure/signed-enrollment/types';

/** Setup lock precedes the shared vault lock; no caller acquires these in reverse. */
export const lockSignedEnrollment = async (
  transaction: SignedEnrollmentTransaction,
  scope: EnrollmentTranscriptScope,
): Promise<void> => {
  await transaction.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${`vault-setup:${scope.workspaceId}`}, 0))`,
  );
  await transaction.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${scope.vaultId}, 0))`,
  );
};
