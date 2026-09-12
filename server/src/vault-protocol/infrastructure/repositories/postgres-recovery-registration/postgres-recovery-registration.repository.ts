import { DomainError } from '@budget/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, lt, sql } from 'drizzle-orm';
import { randomBytes, randomUUID } from 'node:crypto';
import type { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import {
  vaultKeysets,
  vaultRecoveryAuthorityChallenges,
} from '@shared/infrastructure/database/schema';
import type { RecoveryRegistrationRepositoryPort } from '@vault-protocol/domain/ports/recovery-registration';
import { recoveryRegistrationFormat } from '@vault-protocol/domain/recovery-registration/constants';
import { RecoveryAuthorityRegistration } from '@vault-protocol/domain/entities/recovery-authority-registration';
import type {
  PrepareRecoveryRegistration,
  RecoveryRegistrationScope,
} from '@vault-protocol/domain/recovery-registration/types';
import { mapRecoveryAuthorityRowToDomain } from '@vault-protocol/infrastructure/mappers/map-recovery-authority';
import { mapRecoveryRegistrationRowToDomain } from '@vault-protocol/infrastructure/mappers/map-recovery-registration';
import { loadRecoveryRegistrationAuthority } from '@vault-protocol/infrastructure/recovery-registration/load-authority';

@Injectable()
export class PostgresRecoveryRegistrationRepository implements RecoveryRegistrationRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly database: DrizzleDatabase) {}

  async prepare(
    request: PrepareRecoveryRegistration,
  ): Promise<RecoveryAuthorityRegistration> {
    return this.database.transaction(async (transaction) => {
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${request.vaultId}, 0))`,
      );
      const row = await loadRecoveryRegistrationAuthority(transaction, request);
      if (row === undefined)
        throw new DomainError('Recovery authority registration is unavailable');
      const authority = mapRecoveryAuthorityRowToDomain(row);
      const now = Date.now();
      const registration = new RecoveryAuthorityRegistration({
        userId: request.userId,
        workspaceId: request.workspaceId,
        vaultId: request.vaultId,
        keyId: request.keyId,
        deviceId: request.deviceId,
        id: randomUUID(),
        challenge: randomBytes(
          recoveryRegistrationFormat.challengeBytes,
        ).toString('base64url'),
        signingPublicKey: authority.signingPublicKey,
        recoveryPublicKey: request.recoveryPublicKey,
        createdAt: now,
        expiresAt: now + recoveryRegistrationFormat.ttlMs,
      });
      registration.assertCanRegister(authority, now);
      await transaction
        .delete(vaultRecoveryAuthorityChallenges)
        .where(
          and(
            eq(vaultRecoveryAuthorityChallenges.userId, request.userId),
            eq(
              vaultRecoveryAuthorityChallenges.workspaceId,
              request.workspaceId,
            ),
            eq(vaultRecoveryAuthorityChallenges.vaultId, request.vaultId),
            lt(vaultRecoveryAuthorityChallenges.expiresAt, new Date(now)),
          ),
        );
      const inserted = await transaction
        .insert(vaultRecoveryAuthorityChallenges)
        .values({
          ...registration.snapshot,
          createdAt: new Date(registration.snapshot.createdAt),
          expiresAt: new Date(registration.snapshot.expiresAt),
          consumedAt: null,
        })
        .returning();
      const insertedRow = inserted[0];
      if (insertedRow === undefined)
        throw new DomainError('Recovery authority registration is unavailable');
      return mapRecoveryRegistrationRowToDomain(insertedRow);
    });
  }

  async findPending(
    scope: RecoveryRegistrationScope,
    challenge: string,
  ): Promise<RecoveryAuthorityRegistration | undefined> {
    const rows = await this.database
      .select()
      .from(vaultRecoveryAuthorityChallenges)
      .where(
        and(
          eq(vaultRecoveryAuthorityChallenges.userId, scope.userId),
          eq(vaultRecoveryAuthorityChallenges.workspaceId, scope.workspaceId),
          eq(vaultRecoveryAuthorityChallenges.vaultId, scope.vaultId),
          eq(vaultRecoveryAuthorityChallenges.keyId, scope.keyId),
          eq(vaultRecoveryAuthorityChallenges.deviceId, scope.deviceId),
          eq(vaultRecoveryAuthorityChallenges.challenge, challenge),
          isNull(vaultRecoveryAuthorityChallenges.consumedAt),
          gt(
            vaultRecoveryAuthorityChallenges.expiresAt,
            sql`clock_timestamp()`,
          ),
        ),
      )
      .limit(1);
    return rows[0] === undefined
      ? undefined
      : mapRecoveryRegistrationRowToDomain(rows[0]);
  }

  async register(registration: RecoveryAuthorityRegistration): Promise<void> {
    await this.database.transaction(async (transaction) => {
      const snapshot = registration.snapshot;
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${snapshot.vaultId}, 0))`,
      );
      const rows = await transaction
        .select()
        .from(vaultRecoveryAuthorityChallenges)
        .where(
          and(
            eq(vaultRecoveryAuthorityChallenges.id, snapshot.id),
            eq(vaultRecoveryAuthorityChallenges.challenge, snapshot.challenge),
            eq(vaultRecoveryAuthorityChallenges.userId, snapshot.userId),
            eq(
              vaultRecoveryAuthorityChallenges.workspaceId,
              snapshot.workspaceId,
            ),
            eq(vaultRecoveryAuthorityChallenges.vaultId, snapshot.vaultId),
            eq(vaultRecoveryAuthorityChallenges.keyId, snapshot.keyId),
            eq(vaultRecoveryAuthorityChallenges.deviceId, snapshot.deviceId),
          ),
        )
        .limit(1);
      const pending = rows[0];
      if (pending === undefined)
        throw new DomainError('Recovery authority registration is unavailable');
      const stored = mapRecoveryRegistrationRowToDomain(pending);
      if (
        !Buffer.from(stored.toSigningBytes()).equals(
          Buffer.from(registration.toSigningBytes()),
        )
      )
        throw new DomainError('Recovery authority registration is unavailable');
      const authorityRow = await loadRecoveryRegistrationAuthority(
        transaction,
        snapshot,
      );
      if (authorityRow === undefined)
        throw new DomainError('Recovery authority registration is unavailable');
      const consumed = stored.consume(
        mapRecoveryAuthorityRowToDomain(authorityRow),
        Date.now(),
      );
      const consumedAt = consumed.snapshot.consumedAt;
      if (consumedAt === undefined)
        throw new DomainError('Recovery authority registration is unavailable');
      const consumedRows = await transaction
        .update(vaultRecoveryAuthorityChallenges)
        .set({ consumedAt: new Date(consumedAt) })
        .where(
          and(
            eq(vaultRecoveryAuthorityChallenges.id, pending.id),
            isNull(vaultRecoveryAuthorityChallenges.consumedAt),
            gt(
              vaultRecoveryAuthorityChallenges.expiresAt,
              sql`clock_timestamp()`,
            ),
          ),
        )
        .returning({ id: vaultRecoveryAuthorityChallenges.id });
      if (consumedRows.length !== 1)
        throw new DomainError('Recovery authority registration is unavailable');
      const registered = await transaction
        .update(vaultKeysets)
        .set({
          recoveryPublicKey: snapshot.recoveryPublicKey,
          updatedAt: new Date(),
        })
        .from(vaultRecoveryAuthorityChallenges)
        .where(
          and(
            eq(vaultKeysets.id, authorityRow.keysetId),
            eq(vaultKeysets.keyId, snapshot.keyId),
            isNull(vaultKeysets.recoveryPublicKey),
            eq(vaultRecoveryAuthorityChallenges.id, pending.id),
            gt(
              vaultRecoveryAuthorityChallenges.expiresAt,
              sql`clock_timestamp()`,
            ),
          ),
        )
        .returning({ id: vaultKeysets.id });
      if (registered.length !== 1)
        throw new DomainError('Recovery authority registration is unavailable');
    });
  }
}
