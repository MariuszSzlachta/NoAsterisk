import { DomainError } from '@budget/domain';
import { SignedEnrollment } from '@vault-protocol/domain/entities/signed-enrollment';
import { signedEnrollmentChallenges } from '@shared/infrastructure/database/schema';
import { signedEnrollmentStorageSchema } from '@vault-protocol/infrastructure/mappers/map-signed-enrollment/signed-enrollment.schema';

export const mapRowToSignedEnrollment = (
  row: typeof signedEnrollmentChallenges.$inferSelect,
): SignedEnrollment => {
  let raw: unknown;
  try {
    raw = JSON.parse(row.intent);
  } catch {
    throw new DomainError('Enrollment unavailable');
  }
  const parsed = signedEnrollmentStorageSchema.safeParse(raw);
  if (!parsed.success) throw new DomainError('Enrollment unavailable');
  const entity = new SignedEnrollment(parsed.data);
  entity.assertScope({
    accountId: row.userId,
    workspaceId: row.workspaceId,
    vaultId: row.vaultId,
    keyId: parsed.data.intent.keyId,
    deviceId: row.deviceId,
  });
  if (
    entity.snapshot.intent.challenge !== row.challenge ||
    entity.snapshot.intent.createdAt !== row.createdAt.getTime() ||
    entity.snapshot.intent.expiresAt !== row.expiresAt.getTime()
  )
    throw new DomainError('Enrollment unavailable');
  entity.assertRecordedLifecycle(
    row.consumedAt?.getTime(),
    row.confirmedAt?.getTime(),
  );
  return entity;
};
