import { DomainError } from '@budget/domain';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import {
  vaults,
  vaultKeysets,
  vaultDevices,
  vaultDeviceEnvelopes,
  vaultServerShares,
} from '@shared/infrastructure/database/schema';
import type { EnrollmentTranscript } from '@vault-protocol/domain/value-objects/enrollment-transcript';
import type { SignedEnrollmentTransaction } from '@vault-protocol/infrastructure/signed-enrollment/types';
import { ServerShareEncryptionAdapter } from '@vault-protocol/infrastructure/server-share-encryption.adapter';
import type { SignedEnrollment } from '@vault-protocol/domain/entities/signed-enrollment';
import { replaceExpiredPendingEnrollmentDevice } from '@vault-protocol/infrastructure/signed-enrollment/replace-expired-pending-device';
import { enrollmentTranscriptFormat } from '@vault-protocol/domain/value-objects/enrollment-transcript/constants';

export const saveSignedEnrollmentDevice = async (
  transaction: SignedEnrollmentTransaction,
  transcript: EnrollmentTranscript,
  serverShare: Uint8Array,
  enrollment: SignedEnrollment,
): Promise<void> => {
  const intent = transcript.snapshot;
  const now = new Date();
  if (intent.purpose === 'initial') {
    await transaction.insert(vaults).values({
      id: intent.vaultId,
      workspaceId: intent.workspaceId,
      encryptedBlob: '',
      contentHash: '',
      byteSize: 0,
      revision: 0,
      createdAt: now,
      updatedAt: now,
    });
    await transaction.insert(vaultKeysets).values({
      id: randomUUID(),
      vaultId: intent.vaultId,
      keyId: intent.keyId,
      protocolVersion: enrollmentTranscriptFormat.version.toString(),
      cryptoSuite: enrollmentTranscriptFormat.suite,
      recoveryPublicKey: intent.recoveryPublicKey,
      createdAt: now,
      updatedAt: now,
    });
  }
  const keysets = await transaction
    .select({ id: vaultKeysets.id })
    .from(vaultKeysets)
    .innerJoin(vaults, eq(vaultKeysets.vaultId, vaults.id))
    .where(
      and(
        eq(vaults.workspaceId, intent.workspaceId),
        eq(vaults.id, intent.vaultId),
        eq(vaultKeysets.keyId, intent.keyId),
      ),
    )
    .limit(1);
  const keyset = keysets[0];
  if (keyset === undefined) throw new DomainError('Enrollment unavailable');
  enrollment.assertScope(intent);
  await replaceExpiredPendingEnrollmentDevice(transaction, enrollment);
  const deviceId = randomUUID();
  await transaction.insert(vaultDevices).values({
    id: deviceId,
    keysetId: keyset.id,
    userId: intent.accountId,
    deviceId: intent.deviceId,
    signingPublicKey: intent.signingPublicKey,
    status: 'pending',
    revoked: false,
    createdAt: now,
    lastSeenAt: now,
  });
  const encrypted = new ServerShareEncryptionAdapter().encrypt(serverShare);
  await transaction.insert(vaultServerShares).values({
    id: randomUUID(),
    deviceId,
    ...encrypted,
    createdAt: now,
    updatedAt: now,
  });
  await transaction.insert(vaultDeviceEnvelopes).values(
    [
      { purpose: 'device-wrap', envelope: intent.deviceEnvelope },
      ...(intent.passkeyEnvelope === undefined
        ? []
        : [{ purpose: 'passkey-wrap', envelope: intent.passkeyEnvelope }]),
    ].map((item) => ({
      id: randomUUID(),
      deviceId,
      keysetId: keyset.id,
      protocolVersion: enrollmentTranscriptFormat.version.toString(),
      ...item,
      createdAt: now,
      updatedAt: now,
    })),
  );
};
