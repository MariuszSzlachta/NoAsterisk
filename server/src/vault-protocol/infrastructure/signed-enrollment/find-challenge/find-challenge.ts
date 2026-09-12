import { and, eq } from 'drizzle-orm';
import { DomainError } from '@budget/domain';
import { signedEnrollmentChallenges } from '@shared/infrastructure/database/schema';
import type { EnrollmentTranscriptScope } from '@vault-protocol/domain/value-objects/enrollment-transcript';
import type { SignedEnrollmentTransaction } from '@vault-protocol/infrastructure/signed-enrollment/types';

export const findSignedEnrollmentChallenge = async (
  transaction: SignedEnrollmentTransaction,
  scope: EnrollmentTranscriptScope & { readonly challenge: string },
): Promise<typeof signedEnrollmentChallenges.$inferSelect> => {
  const rows = await transaction
    .select()
    .from(signedEnrollmentChallenges)
    .where(
      and(
        eq(signedEnrollmentChallenges.userId, scope.accountId),
        eq(signedEnrollmentChallenges.workspaceId, scope.workspaceId),
        eq(signedEnrollmentChallenges.vaultId, scope.vaultId),
        eq(signedEnrollmentChallenges.deviceId, scope.deviceId),
        eq(signedEnrollmentChallenges.challenge, scope.challenge),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (row === undefined) throw new DomainError('Enrollment unavailable');
  return row;
};
