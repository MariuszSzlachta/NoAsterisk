import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { randomBytes, randomUUID } from 'node:crypto';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { webauthnChallenges } from '@shared/infrastructure/database/schema';
import type {
  WebauthnChallengeRecord,
  WebauthnChallengeStorePort,
} from '@vault-protocol/domain/ports/webauthn-challenge.store';

const TTL_MS = 60_000;

@Injectable()
export class PostgresWebauthnChallengeStore implements WebauthnChallengeStorePort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async create(input: {
    readonly userId: string;
    readonly vaultId?: string;
    readonly deviceId: string;
    readonly type: 'registration' | 'authentication' | 'login';
  }): Promise<WebauthnChallengeRecord> {
    const challenge = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + TTL_MS);
    await this.db.insert(webauthnChallenges).values({
      id: randomUUID(),
      userId: input.userId,
      ...(input.vaultId === undefined ? {} : { vaultId: input.vaultId }),
      deviceId: input.deviceId,
      challenge,
      type: input.type,
      expiresAt,
      createdAt: new Date(),
    });
    return {
      ...input,
      challenge,
      expiresAt: expiresAt.getTime(),
    };
  }

  async consume(
    challenge: string,
    input: {
      readonly userId: string;
      readonly vaultId?: string;
      readonly deviceId: string;
      readonly type: 'registration' | 'authentication' | 'login';
    },
  ): Promise<WebauthnChallengeRecord> {
    const now = new Date();
    const rows = await this.db
      .update(webauthnChallenges)
      .set({ consumedAt: now })
      .where(
        and(
          eq(webauthnChallenges.challenge, challenge),
          eq(webauthnChallenges.userId, input.userId),
          input.vaultId === undefined
            ? isNull(webauthnChallenges.vaultId)
            : eq(webauthnChallenges.vaultId, input.vaultId),
          eq(webauthnChallenges.deviceId, input.deviceId),
          eq(webauthnChallenges.type, input.type),
          gt(webauthnChallenges.expiresAt, now),
          isNull(webauthnChallenges.consumedAt),
        ),
      )
      .returning();
    const row = rows[0];
    if (!row) throw new Error('Invalid WebAuthn challenge');
    if (
      row.type !== 'registration' &&
      row.type !== 'authentication' &&
      row.type !== 'login'
    )
      throw new Error('Invalid WebAuthn challenge');
    return {
      challenge: row.challenge,
      userId: row.userId,
      ...(row.vaultId === null ? {} : { vaultId: row.vaultId }),
      deviceId: row.deviceId,
      type: row.type,
      expiresAt: row.expiresAt.getTime(),
    };
  }
}
