import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { webauthnCredentials } from '@shared/infrastructure/database/schema';
import type {
  CreateWebauthnCredential,
  StoredWebauthnCredential,
  WebauthnCredentialRepository,
} from '@vault-protocol/domain/ports/webauthn-credential.repository';

const encode = (value: Uint8Array): string =>
  Buffer.from(value).toString('base64');
const decode = (value: string): Uint8Array<ArrayBuffer> =>
  new Uint8Array(Buffer.from(value, 'base64'));

const mapCredential = (
  row: typeof webauthnCredentials.$inferSelect,
): StoredWebauthnCredential => ({
  id: row.id,
  userId: row.userId,
  credentialId: row.credentialId,
  publicKey: decode(row.publicKey),
  counter: Number(row.counter),
  transports:
    row.transports === null ? [] : row.transports.split(',').filter(Boolean),
  supportsPrf: row.supportsPrf === 1,
  ...(row.revokedAt === null ? {} : { revokedAt: row.revokedAt }),
});

@Injectable()
export class PostgresWebauthnCredentialRepository implements WebauthnCredentialRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async create(input: CreateWebauthnCredential): Promise<void> {
    await this.db.insert(webauthnCredentials).values({
      id: randomUUID(),
      userId: input.userId,
      credentialId: input.credentialId,
      publicKey: encode(input.publicKey),
      counter: String(input.counter),
      transports: input.transports.join(','),
      supportsPrf: input.supportsPrf ? 1 : 0,
      createdAt: new Date(),
      lastUsedAt: null,
      revokedAt: null,
    });
  }

  async findActiveByCredentialId(
    credentialId: string,
  ): Promise<StoredWebauthnCredential | undefined> {
    const rows = await this.db
      .select()
      .from(webauthnCredentials)
      .where(
        and(
          eq(webauthnCredentials.credentialId, credentialId),
          isNull(webauthnCredentials.revokedAt),
        ),
      );
    return rows[0] === undefined ? undefined : mapCredential(rows[0]);
  }

  async listActiveByUserId(
    userId: string,
  ): Promise<ReadonlyArray<StoredWebauthnCredential>> {
    const rows = await this.db
      .select()
      .from(webauthnCredentials)
      .where(
        and(
          eq(webauthnCredentials.userId, userId),
          isNull(webauthnCredentials.revokedAt),
        ),
      );
    return rows.map(mapCredential);
  }

  async updateCounter(credentialId: string, counter: number): Promise<void> {
    await this.db
      .update(webauthnCredentials)
      .set({
        counter: String(counter),
        lastUsedAt: new Date(),
      })
      .where(eq(webauthnCredentials.credentialId, credentialId));
  }

  async revoke(userId: string, credentialId: string): Promise<void> {
    await this.db
      .update(webauthnCredentials)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(webauthnCredentials.userId, userId),
          eq(webauthnCredentials.credentialId, credentialId),
        ),
      );
  }
}
