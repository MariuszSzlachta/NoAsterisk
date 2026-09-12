import { and, eq } from 'drizzle-orm';
import {
  vaults,
  vaultKeysets,
  vaultDevices,
} from '@shared/infrastructure/database/schema';
import type {
  SignedEnrollment,
  SignedEnrollmentAuthority,
} from '@vault-protocol/domain/entities/signed-enrollment';
import type { SignedEnrollmentTransaction } from '@vault-protocol/infrastructure/signed-enrollment/types';
import { DomainError } from '@budget/domain';

export const loadSignedEnrollmentAuthority = async (
  transaction: SignedEnrollmentTransaction,
  enrollment: SignedEnrollment,
): Promise<SignedEnrollmentAuthority> => {
  const intent = enrollment.snapshot.intent;
  const rows = await transaction
    .select({
      vaultId: vaults.id,
      keyId: vaultKeysets.keyId,
      protocolVersion: vaultKeysets.protocolVersion,
      cryptoSuite: vaultKeysets.cryptoSuite,
      recoveryPublicKey: vaultKeysets.recoveryPublicKey,
    })
    .from(vaults)
    .leftJoin(vaultKeysets, eq(vaults.id, vaultKeysets.vaultId))
    .where(eq(vaults.workspaceId, intent.workspaceId))
    .limit(1);
  const row = rows[0];
  if (row === undefined) return { kind: 'empty' };
  if (
    row.keyId === null ||
    row.protocolVersion === null ||
    row.cryptoSuite === null
  )
    throw new DomainError('Enrollment unavailable');
  const approvers =
    intent.purpose !== 'trusted'
      ? []
      : await transaction
          .select({
            deviceId: vaultDevices.deviceId,
            signingPublicKey: vaultDevices.signingPublicKey,
            isRevoked: vaultDevices.revoked,
            status: vaultDevices.status,
          })
          .from(vaultDevices)
          .innerJoin(vaultKeysets, eq(vaultDevices.keysetId, vaultKeysets.id))
          .innerJoin(vaults, eq(vaultKeysets.vaultId, vaults.id))
          .where(
            and(
              eq(vaultDevices.userId, intent.accountId),
              eq(vaults.workspaceId, intent.workspaceId),
              eq(vaults.id, intent.vaultId),
              eq(vaultKeysets.keyId, intent.keyId),
              eq(vaultDevices.deviceId, intent.oldDeviceId),
            ),
          )
          .limit(1);
  const approver = approvers[0];
  return {
    kind: 'existing',
    vaultId: row.vaultId,
    keyId: row.keyId,
    protocolVersion: row.protocolVersion,
    cryptoSuite: row.cryptoSuite,
    recoveryPublicKey: row.recoveryPublicKey ?? undefined,
    approver:
      approver === undefined || approver.signingPublicKey === null
        ? undefined
        : {
            deviceId: approver.deviceId,
            signingPublicKey: approver.signingPublicKey,
            isRevoked: approver.isRevoked,
            status: approver.status,
          },
  };
};
