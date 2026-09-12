import { DomainError } from '@budget/domain';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import {
  signedEnrollmentChallenges,
  vaultDevices,
  vaultKeysets,
  vaults,
} from '@shared/infrastructure/database/schema';
import type { SignedEnrollment } from '@vault-protocol/domain/entities/signed-enrollment';
import type { SignedEnrollmentTransaction } from '@vault-protocol/infrastructure/signed-enrollment/types';

export const replaceExpiredPendingEnrollmentDevice = async (
  transaction: SignedEnrollmentTransaction,
  enrollment: SignedEnrollment,
): Promise<void> => {
  const intent = enrollment.snapshot.intent;
  const previous = await transaction
    .select({
      id: vaultDevices.id,
      accountId: vaultDevices.userId,
      workspaceId: vaults.workspaceId,
      vaultId: vaults.id,
      keyId: vaultKeysets.keyId,
      deviceId: vaultDevices.deviceId,
      status: vaultDevices.status,
      isRevoked: vaultDevices.revoked,
      signingPublicKey: vaultDevices.signingPublicKey,
    })
    .from(vaultDevices)
    .innerJoin(vaultKeysets, eq(vaultDevices.keysetId, vaultKeysets.id))
    .innerJoin(vaults, eq(vaultKeysets.vaultId, vaults.id))
    .where(
      and(
        eq(vaultDevices.userId, intent.accountId),
        eq(vaults.workspaceId, intent.workspaceId),
        eq(vaultDevices.deviceId, intent.deviceId),
      ),
    )
    .limit(1);
  const binding = previous[0];
  if (binding === undefined) return;
  const live = await transaction
    .select({ id: signedEnrollmentChallenges.id })
    .from(signedEnrollmentChallenges)
    .where(
      and(
        eq(signedEnrollmentChallenges.userId, intent.accountId),
        eq(signedEnrollmentChallenges.workspaceId, intent.workspaceId),
        eq(signedEnrollmentChallenges.vaultId, intent.vaultId),
        eq(signedEnrollmentChallenges.deviceId, intent.deviceId),
        isNotNull(signedEnrollmentChallenges.consumedAt),
        sql`${signedEnrollmentChallenges.expiresAt} > clock_timestamp()`,
      ),
    )
    .limit(1);
  enrollment.assertPendingDeviceReplacement(binding, live.length !== 0);
  const removed = await transaction
    .delete(vaultDevices)
    .where(
      and(
        eq(vaultDevices.id, binding.id),
        eq(vaultDevices.userId, intent.accountId),
        eq(vaultDevices.deviceId, intent.deviceId),
        eq(vaultDevices.status, 'pending'),
        eq(vaultDevices.revoked, false),
        binding.signingPublicKey === null
          ? sql`${vaultDevices.signingPublicKey} is null`
          : eq(vaultDevices.signingPublicKey, binding.signingPublicKey),
      ),
    )
    .returning({ id: vaultDevices.id });
  if (removed.length !== 1) throw new DomainError('Enrollment unavailable');
};
