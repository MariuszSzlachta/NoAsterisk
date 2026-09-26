import { DomainError } from '@budget/domain';
import { ConflictException } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, inArray, isNull, lt, sql } from 'drizzle-orm';
import { randomBytes, randomUUID } from 'node:crypto';
import type { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import {
  vaultDevices,
  vaultKeysets,
  vaultRotationChallenges,
  vaultRotations,
  vaultServerShares,
  vaultSyncSnapshots,
  vaultDeviceEnvelopes,
  vaults,
} from '@shared/infrastructure/database/schema';
import type {
  DualRootRotationRepository,
  PrepareDualRootRotationRequest,
} from '@vault-protocol/domain/ports/dual-root-rotation';
import { mapRotationChallengeToTranscript } from '@vault-protocol/infrastructure/mappers/mapRotationChallengeToTranscript';
import { vaultRotationTranscriptFormat } from '@vault-protocol/domain/value-objects/vault-rotation-transcript/constants';
import { VaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';

@Injectable()
export class PostgresDualRootRotationRepository implements DualRootRotationRepository {
  constructor(@Inject(DRIZZLE) private readonly database: DrizzleDatabase) {}

  async prepare(
    request: PrepareDualRootRotationRequest,
    authDeadline: number,
  ): Promise<VaultRotationTranscript> {
    return this.database.transaction(async (transaction) => {
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${request.vaultId}, 0))`,
      );
      const keysets = await transaction
        .select({
          keysetId: vaultKeysets.id,
          recoveryPublicKey: vaultKeysets.recoveryPublicKey,
        })
        .from(vaultKeysets)
        .innerJoin(vaults, eq(vaultKeysets.vaultId, vaults.id))
        .where(
          and(
            eq(vaults.id, request.vaultId),
            eq(vaults.workspaceId, request.workspaceId),
            eq(vaultKeysets.keyId, request.currentKeyId),
            sql`${new Date(authDeadline)}::timestamptz >= clock_timestamp()`,
          ),
        );
      const keyset = keysets[0];
      if (keyset === undefined || keyset.recoveryPublicKey === null)
        throw new DomainError('Dual-root vault rotation is unavailable');

      const devices = await transaction
        .select({
          signingPublicKey: vaultDevices.signingPublicKey,
          revoked: vaultDevices.revoked,
          status: vaultDevices.status,
        })
        .from(vaultDevices)
        .where(
          and(
            eq(vaultDevices.userId, request.userId),
            eq(vaultDevices.keysetId, keyset.keysetId),
            eq(vaultDevices.deviceId, request.deviceId),
          ),
        );
      const device = devices[0];
      if (
        device === undefined ||
        device.revoked ||
        (device.status !== 'active' && device.status !== 'high-security') ||
        device.signingPublicKey !== request.signingPublicKey
      )
        throw new DomainError('Dual-root vault rotation is unavailable');

      const createdAt = Date.now();
      const challenge = randomBytes(32).toString('base64url');
      const transcript = new VaultRotationTranscript({
        accountId: request.userId,
        workspaceId: request.workspaceId,
        vaultId: request.vaultId,
        deviceId: request.deviceId,
        currentKeyId: request.currentKeyId,
        nextKeyId: request.nextKeyId,
        challenge,
        expiresAt: createdAt + vaultRotationTranscriptFormat.ttlMs,
        currentRecoveryPublicKey: keyset.recoveryPublicKey,
        nextRecoveryPublicKey: request.nextRecoveryPublicKey,
        signingPublicKey: request.signingPublicKey,
        envelopePurpose: request.envelopePurpose,
        envelope: request.envelope,
        ...(request.passkeyEnvelope === undefined
          ? {}
          : { passkeyEnvelope: request.passkeyEnvelope }),
      });
      await transaction
        .delete(vaultRotationChallenges)
        .where(
          and(
            eq(vaultRotationChallenges.userId, request.userId),
            eq(vaultRotationChallenges.workspaceId, request.workspaceId),
            eq(vaultRotationChallenges.vaultId, request.vaultId),
            lt(vaultRotationChallenges.expiresAt, sql`clock_timestamp()`),
            isNull(vaultRotationChallenges.consumedAt),
          ),
        );
      const inserted = await transaction
        .insert(vaultRotationChallenges)
        .values({
          id: randomUUID(),
          userId: request.userId,
          workspaceId: request.workspaceId,
          vaultId: request.vaultId,
          deviceId: request.deviceId,
          currentKeyId: request.currentKeyId,
          nextKeyId: request.nextKeyId,
          challenge: transcript.snapshot.challenge,
          expiresAt: new Date(transcript.snapshot.expiresAt),
          currentRecoveryPublicKey:
            transcript.snapshot.currentRecoveryPublicKey,
          nextRecoveryPublicKey: transcript.snapshot.nextRecoveryPublicKey,
          signingPublicKey: transcript.snapshot.signingPublicKey,
          envelopePurpose: transcript.snapshot.envelopePurpose,
          envelope: transcript.snapshot.envelope,
          ...(transcript.snapshot.passkeyEnvelope === undefined
            ? {}
            : { passkeyEnvelope: transcript.snapshot.passkeyEnvelope }),
          createdAt: new Date(createdAt),
          consumedAt: null,
        })
        .returning({ id: vaultRotationChallenges.id });
      if (inserted[0] === undefined)
        throw new DomainError('Dual-root vault rotation is unavailable');
      const deadline = await transaction
        .select({
          isFresh: sql<boolean>`${new Date(authDeadline)}::timestamptz >= clock_timestamp()`,
        })
        .from(vaultRotationChallenges)
        .where(eq(vaultRotationChallenges.id, inserted[0].id))
        .limit(1);
      if (deadline[0]?.isFresh !== true)
        throw new DomainError('Dual-root vault rotation is unavailable');
      return transcript;
    });
  }

  async finalize(
    transcript: VaultRotationTranscript,
    _proof: import('@vault-protocol/domain/value-objects/vault-rotation-proof').VaultRotationProof,
    authDeadline: number,
  ): Promise<void> {
    return this.database.transaction(async (transaction) => {
      const snapshot = transcript.snapshot;
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${snapshot.vaultId}, 0))`,
      );
      if (authDeadline < Date.now())
        throw new DomainError('Dual-root vault rotation is unavailable');
      const completed = await transaction
        .select({
          userId: vaultRotations.userId,
          deviceId: vaultRotations.deviceId,
          currentKeyId: vaultRotations.currentKeyId,
          nextKeyId: vaultRotations.nextKeyId,
          envelopePurpose: vaultRotations.envelopePurpose,
          envelope: vaultRotations.envelope,
        })
        .from(vaultRotations)
        .where(
          and(
            eq(vaultRotations.vaultId, snapshot.vaultId),
            eq(vaultRotations.idempotencyKey, snapshot.challenge),
          ),
        )
        .limit(1);
      const completedRotation = completed[0];
      if (completedRotation !== undefined) {
        // Consumed challenges are immutable receipts; later rotations must not
        // change the identity of an already committed request.
        const receipts = await transaction
          .select()
          .from(vaultRotationChallenges)
          .where(
            and(
              eq(vaultRotationChallenges.challenge, snapshot.challenge),
              eq(vaultRotationChallenges.vaultId, snapshot.vaultId),
              eq(vaultRotationChallenges.userId, snapshot.accountId),
              eq(vaultRotationChallenges.workspaceId, snapshot.workspaceId),
              sql`${vaultRotationChallenges.consumedAt} is not null`,
              sql`${new Date(authDeadline)}::timestamptz >= clock_timestamp()`,
            ),
          )
          .limit(1);
        const receipt = receipts[0];
        if (
          completedRotation.userId !== snapshot.accountId ||
          receipt === undefined ||
          !Buffer.from(
            mapRotationChallengeToTranscript(receipt).toSigningBytes(),
          ).equals(Buffer.from(transcript.toSigningBytes()))
        )
          throw new ConflictException('Vault rotation idempotency conflict');
        return;
      }
      const rows = await transaction
        .select()
        .from(vaultRotationChallenges)
        .where(
          and(
            eq(vaultRotationChallenges.challenge, snapshot.challenge),
            eq(vaultRotationChallenges.userId, snapshot.accountId),
            eq(vaultRotationChallenges.workspaceId, snapshot.workspaceId),
            eq(vaultRotationChallenges.vaultId, snapshot.vaultId),
            isNull(vaultRotationChallenges.consumedAt),
            gt(vaultRotationChallenges.expiresAt, sql`clock_timestamp()`),
            sql`${new Date(authDeadline)}::timestamptz >= clock_timestamp()`,
          ),
        )
        .limit(1);
      const pending = rows[0];
      if (pending === undefined)
        throw new DomainError('Dual-root vault rotation is unavailable');
      const stored = mapRotationChallengeToTranscript(pending);
      if (
        !Buffer.from(stored.toSigningBytes()).equals(
          Buffer.from(transcript.toSigningBytes()),
        )
      )
        throw new DomainError('Dual-root vault rotation is unavailable');

      const keysets = await transaction
        .select({ id: vaultKeysets.id, keyId: vaultKeysets.keyId })
        .from(vaultKeysets)
        .innerJoin(vaults, eq(vaultKeysets.vaultId, vaults.id))
        .where(
          and(
            eq(vaultKeysets.vaultId, snapshot.vaultId),
            eq(vaults.workspaceId, snapshot.workspaceId),
            eq(vaultKeysets.keyId, snapshot.currentKeyId),
            eq(
              vaultKeysets.recoveryPublicKey,
              snapshot.currentRecoveryPublicKey,
            ),
          ),
        );
      const keyset = keysets[0];
      if (keyset === undefined) throw new DomainError('Vault key has changed');
      const devices = await transaction
        .select({ id: vaultDevices.id, deviceId: vaultDevices.deviceId })
        .from(vaultDevices)
        .where(
          and(
            eq(vaultDevices.keysetId, keyset.id),
            eq(vaultDevices.userId, snapshot.accountId),
            eq(vaultDevices.deviceId, snapshot.deviceId),
            eq(vaultDevices.signingPublicKey, snapshot.signingPublicKey),
            eq(vaultDevices.revoked, false),
            sql`${vaultDevices.status} in ('active', 'high-security')`,
          ),
        );
      const initiator = devices[0];
      if (initiator === undefined)
        throw new DomainError('Dual-root vault rotation is unavailable');

      const consumed = await transaction
        .update(vaultRotationChallenges)
        .set({
          consumedAt: sql`greatest(clock_timestamp(), ${vaultRotationChallenges.createdAt})`,
        })
        .where(
          and(
            eq(vaultRotationChallenges.id, pending.id),
            isNull(vaultRotationChallenges.consumedAt),
            gt(vaultRotationChallenges.expiresAt, sql`clock_timestamp()`),
            sql`${new Date(authDeadline)}::timestamptz >= clock_timestamp()`,
          ),
        )
        .returning({ id: vaultRotationChallenges.id });
      if (consumed.length !== 1)
        throw new DomainError('Dual-root vault rotation is unavailable');

      const allDevices = await transaction
        .select({ id: vaultDevices.id, revoked: vaultDevices.revoked })
        .from(vaultDevices)
        .where(eq(vaultDevices.keysetId, keyset.id));
      const otherIds = allDevices
        .filter((device) => device.id !== initiator.id)
        .map((device) => device.id);
      if (otherIds.length > 0) {
        await transaction
          .delete(vaultServerShares)
          .where(inArray(vaultServerShares.deviceId, otherIds));
        await transaction
          .update(vaultDevices)
          .set({
            revoked: true,
            status: 'revoked',
            revokedAt: sql`clock_timestamp()`,
          })
          .where(inArray(vaultDevices.id, otherIds));
        await transaction
          .delete(vaultDeviceEnvelopes)
          .where(inArray(vaultDeviceEnvelopes.deviceId, otherIds));
      }
      await transaction
        .delete(vaultSyncSnapshots)
        .where(eq(vaultSyncSnapshots.vaultId, snapshot.vaultId));
      await transaction
        .delete(vaultDeviceEnvelopes)
        .where(eq(vaultDeviceEnvelopes.deviceId, initiator.id));
      const now = sql`clock_timestamp()`;
      await transaction
        .update(vaultKeysets)
        .set({
          keyId: snapshot.nextKeyId,
          recoveryPublicKey: snapshot.nextRecoveryPublicKey,
          protocolVersion: '2',
          cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
          updatedAt: now,
        })
        .where(eq(vaultKeysets.id, keyset.id));
      await transaction.insert(vaultDeviceEnvelopes).values({
        id: randomUUID(),
        deviceId: initiator.id,
        keysetId: keyset.id,
        purpose: snapshot.envelopePurpose,
        envelope: snapshot.envelope,
        protocolVersion: '2',
        createdAt: now,
        updatedAt: now,
      });
      if (snapshot.passkeyEnvelope !== undefined)
        await transaction.insert(vaultDeviceEnvelopes).values({
          id: randomUUID(),
          deviceId: initiator.id,
          keysetId: keyset.id,
          purpose: 'passkey-wrap',
          envelope: snapshot.passkeyEnvelope,
          protocolVersion: '2',
          createdAt: now,
          updatedAt: now,
        });
      await transaction.insert(vaultRotations).values({
        id: randomUUID(),
        vaultId: snapshot.vaultId,
        userId: snapshot.accountId,
        deviceId: initiator.id,
        idempotencyKey: snapshot.challenge,
        currentKeyId: snapshot.currentKeyId,
        nextKeyId: snapshot.nextKeyId,
        envelopePurpose: snapshot.envelopePurpose,
        envelope: snapshot.envelope,
        protocolVersion: '2',
        cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
        revokedDeviceCount: otherIds.length,
        createdAt: now,
      });
      const deadline = await transaction
        .select({
          isFresh: sql<boolean>`${new Date(authDeadline)}::timestamptz >= clock_timestamp()`,
        })
        .from(vaultRotationChallenges)
        .where(eq(vaultRotationChallenges.id, pending.id))
        .limit(1);
      if (deadline[0]?.isFresh !== true)
        throw new DomainError('Dual-root vault rotation is unavailable');
    });
  }
}
