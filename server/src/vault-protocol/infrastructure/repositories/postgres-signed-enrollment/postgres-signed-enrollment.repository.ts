import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '@budget/domain';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { and, eq, isNull, gt, sql } from 'drizzle-orm';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import type { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import {
  signedEnrollmentChallenges,
  vaultDevices,
  vaultKeysets,
  vaults,
} from '@shared/infrastructure/database/schema';
import { SignedEnrollment } from '@vault-protocol/domain/entities/signed-enrollment';
import type {
  SignedEnrollmentInput,
  SignedEnrollmentFinalization,
  SignedEnrollmentConfirmation,
} from '@vault-protocol/domain/entities/signed-enrollment';
import { signedEnrollmentFormat } from '@vault-protocol/domain/entities/signed-enrollment/constants';
import { enrollmentTranscriptFormat } from '@vault-protocol/domain/value-objects/enrollment-transcript/constants';
import type { SignedEnrollmentRepositoryPort } from '@vault-protocol/domain/ports/signed-enrollment';
import { ENROLLMENT_PROOF_VERIFIER } from '@vault-protocol/domain/ports/enrollment-proof-verifier';
import type {
  EnrollmentProofVerifierPort,
  EnrollmentAuthorizationProof,
} from '@vault-protocol/domain/ports/enrollment-proof-verifier';
import { VAULT_SIGNATURE_VERIFIER } from '@vault-protocol/domain/ports/vault-signature-verifier';
import type { VaultSignatureVerifierPort } from '@vault-protocol/domain/ports/vault-signature-verifier';
import { ServerShareEncryptionAdapter } from '@vault-protocol/infrastructure/server-share-encryption.adapter';
import { mapRowToSignedEnrollment } from '@vault-protocol/infrastructure/mappers/map-signed-enrollment';
import { loadSignedEnrollmentAuthority } from '@vault-protocol/infrastructure/signed-enrollment/load-authority';
import { validateEnrollmentPublicKeys } from '@vault-protocol/infrastructure/signed-enrollment/validate-public-keys';
import { saveSignedEnrollmentDevice } from '@vault-protocol/infrastructure/signed-enrollment/save-device';
import { findSignedEnrollmentChallenge } from '@vault-protocol/infrastructure/signed-enrollment/find-challenge';
import { lockSignedEnrollment } from '@vault-protocol/infrastructure/signed-enrollment/lock-enrollment';
import { decryptSignedEnrollmentShare } from '@vault-protocol/infrastructure/signed-enrollment/decrypt-share';

@Injectable()
export class PostgresSignedEnrollmentRepository implements SignedEnrollmentRepositoryPort {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDatabase,
    @Inject(ENROLLMENT_PROOF_VERIFIER)
    private readonly proofs: EnrollmentProofVerifierPort,
    @Inject(VAULT_SIGNATURE_VERIFIER)
    private readonly signatures: VaultSignatureVerifierPort,
  ) {}

  async prepare(
    input: SignedEnrollmentInput,
    authDeadline: number,
  ): Promise<SignedEnrollment> {
    validateEnrollmentPublicKeys(input);
    let prepared: SignedEnrollment | undefined;
    try {
      return await this.db.transaction(async (transaction) => {
        await lockSignedEnrollment(transaction, input);
        const now = Date.now();
        const serverShare = new Uint8Array(
          randomBytes(signedEnrollmentFormat.shareBytes),
        );
        try {
          const context = {
            challenge: randomBytes(
              enrollmentTranscriptFormat.challengeBytes,
            ).toString('base64url'),
            createdAt: now,
            expiresAt: now + enrollmentTranscriptFormat.ttlMs,
            deviceEnvelope: signedEnrollmentFormat.placeholderEnvelope,
          };
          const intent =
            input.purpose === 'trusted'
              ? {
                  ...input,
                  ...context,
                  delegationDigest: signedEnrollmentFormat.placeholderDigest,
                }
              : { ...input, ...context };
          const enrollment = new SignedEnrollment(
            { intent, state: { kind: 'pending' } },
            serverShare,
          );
          prepared = enrollment;
          enrollment.assertLive(Date.now(), authDeadline);
          enrollment.assertAuthority(
            await loadSignedEnrollmentAuthority(transaction, enrollment),
          );
          await transaction
            .delete(signedEnrollmentChallenges)
            .where(
              and(
                eq(signedEnrollmentChallenges.userId, input.accountId),
                eq(signedEnrollmentChallenges.workspaceId, input.workspaceId),
                sql`${signedEnrollmentChallenges.expiresAt} <= clock_timestamp()`,
              ),
            );
          await transaction.insert(signedEnrollmentChallenges).values({
            id: randomUUID(),
            userId: input.accountId,
            workspaceId: input.workspaceId,
            vaultId: input.vaultId,
            deviceId: input.deviceId,
            challenge: enrollment.snapshot.intent.challenge,
            intent: JSON.stringify(enrollment.snapshot),
            encryptedShare: JSON.stringify(
              new ServerShareEncryptionAdapter().encrypt(serverShare),
            ),
            createdAt: new Date(now),
            expiresAt: new Date(now + enrollmentTranscriptFormat.ttlMs),
          });
          return enrollment;
        } finally {
          serverShare.fill(0);
        }
      });
    } catch (error) {
      prepared?.disposePreparedShare();
      throw error;
    }
  }

  async finalize(request: SignedEnrollmentFinalization): Promise<void> {
    await this.db.transaction(async (transaction) => {
      await lockSignedEnrollment(transaction, request);
      const row = await findSignedEnrollmentChallenge(transaction, request);
      const enrollment = mapRowToSignedEnrollment(row);
      enrollment.assertLive(Date.now(), request.authDeadline);
      const authority = await loadSignedEnrollmentAuthority(
        transaction,
        enrollment,
      );
      enrollment.assertAuthority(authority);
      const transcript = enrollment.finalizeTranscript(request);
      const proof: EnrollmentAuthorizationProof =
        request.purpose === 'trusted'
          ? {
              purpose: 'trusted',
              deviceSignature: request.deviceSignature,
              delegationSignature: request.delegationSignature,
              approverSigningPublicKey:
                authority.kind === 'existing' &&
                authority.approver !== undefined
                  ? authority.approver.signingPublicKey
                  : '',
            }
          : {
              purpose: request.purpose,
              deviceSignature: request.deviceSignature,
              recoverySignature: request.recoverySignature,
            };
      if (!(await this.proofs.verify(transcript, proof)))
        throw new DomainError('Enrollment unavailable');
      enrollment.assertLive(Date.now(), request.authDeadline);
      const rechecked = await loadSignedEnrollmentAuthority(
        transaction,
        enrollment,
      );
      enrollment.assertAuthority(rechecked);
      if (
        request.purpose === 'trusted' &&
        (authority.kind !== 'existing' ||
          rechecked.kind !== 'existing' ||
          authority.approver?.signingPublicKey !==
            rechecked.approver?.signingPublicKey)
      )
        throw new DomainError('Enrollment unavailable');
      const share = decryptSignedEnrollmentShare(row.encryptedShare);
      try {
        await saveSignedEnrollmentDevice(
          transaction,
          transcript,
          share,
          enrollment,
        );
      } finally {
        share.fill(0);
      }
      const digest = createHash('sha256')
        .update(transcript.toFinalizeSigningBytes())
        .digest('hex');
      const consumed = enrollment.consume(digest);
      const updated = await transaction
        .update(signedEnrollmentChallenges)
        .set({
          consumedAt: new Date(),
          intent: JSON.stringify(consumed.snapshot),
        })
        .where(
          and(
            eq(signedEnrollmentChallenges.id, row.id),
            isNull(signedEnrollmentChallenges.consumedAt),
            sql`${signedEnrollmentChallenges.expiresAt} > clock_timestamp()`,
            sql`${new Date(request.authDeadline)}::timestamptz >= clock_timestamp()`,
          ),
        )
        .returning({ id: signedEnrollmentChallenges.id });
      if (updated.length !== 1) throw new DomainError('Enrollment unavailable');
    });
  }

  async confirm(request: SignedEnrollmentConfirmation): Promise<void> {
    await this.db.transaction(async (transaction) => {
      await lockSignedEnrollment(transaction, request);
      const row = await findSignedEnrollmentChallenge(transaction, request);
      const enrollment = mapRowToSignedEnrollment(row);
      enrollment.assertScope(request);
      enrollment.assertLive(Date.now(), request.authDeadline);
      const intent = enrollment.snapshot.intent;
      const deviceRows = await transaction
        .select({
          id: vaultDevices.id,
          signingPublicKey: vaultDevices.signingPublicKey,
        })
        .from(vaultDevices)
        .innerJoin(vaultKeysets, eq(vaultDevices.keysetId, vaultKeysets.id))
        .innerJoin(vaults, eq(vaultKeysets.vaultId, vaults.id))
        .where(
          and(
            eq(vaultDevices.userId, request.accountId),
            eq(vaults.workspaceId, request.workspaceId),
            eq(vaults.id, request.vaultId),
            eq(vaultKeysets.keyId, request.keyId),
            eq(vaultDevices.deviceId, request.deviceId),
            eq(vaultDevices.status, 'pending'),
            eq(vaultDevices.revoked, false),
          ),
        )
        .limit(1);
      const device = deviceRows[0];
      if (
        device === undefined ||
        device.signingPublicKey !== intent.signingPublicKey ||
        !(await this.signatures.verifyDevice(
          intent.signingPublicKey,
          enrollment.confirmationBytes(request.digest),
          request.signature,
        ))
      )
        throw new DomainError('Enrollment confirmation unavailable');
      enrollment.assertLive(Date.now(), request.authDeadline);
      const activated = enrollment.activate(request.digest);
      const changed = await transaction
        .update(vaultDevices)
        .set({ status: 'active', lastSeenAt: new Date() })
        .where(
          and(
            eq(vaultDevices.id, device.id),
            eq(vaultDevices.signingPublicKey, intent.signingPublicKey),
            eq(vaultDevices.status, 'pending'),
            eq(vaultDevices.revoked, false),
          ),
        )
        .returning({ id: vaultDevices.id });
      const updated = await transaction
        .update(signedEnrollmentChallenges)
        .set({
          confirmedAt: new Date(),
          intent: JSON.stringify(activated.snapshot),
        })
        .where(
          and(
            eq(signedEnrollmentChallenges.id, row.id),
            isNull(signedEnrollmentChallenges.confirmedAt),
            gt(signedEnrollmentChallenges.consumedAt, new Date(0)),
            sql`${signedEnrollmentChallenges.expiresAt} > clock_timestamp()`,
            sql`${new Date(request.authDeadline)}::timestamptz >= clock_timestamp()`,
          ),
        )
        .returning({ id: signedEnrollmentChallenges.id });
      if (changed.length !== 1 || updated.length !== 1)
        throw new DomainError('Enrollment confirmation unavailable');
    });
  }
}
