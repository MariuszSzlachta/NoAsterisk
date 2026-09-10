import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { InviteCode } from '@invite-codes/domain/invite-code.entity';
import { InviteCodeRepository } from '@invite-codes/domain/ports/invite-code.repository';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { inviteCodes } from '@shared/infrastructure/database/schema';
import { isInviteCodeStatus } from '@invite-codes/infrastructure/persistence/is-invite-code-status';

@Injectable()
export class PostgresInviteCodeRepository implements InviteCodeRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async save(code: InviteCode): Promise<InviteCode> {
    await this.db
      .insert(inviteCodes)
      .values({
        id: code.id,
        code: code.code,
        createdBy: code.createdBy,
        status: code.status,
        createdAt: code.createdAt,
        expiresAt: code.expiresAt ?? null,
        usedBy: code.usedBy ?? null,
        usedAt: code.usedAt ?? null,
      })
      .onConflictDoUpdate({
        target: inviteCodes.id,
        set: {
          status: code.status,
          usedBy: code.usedBy ?? null,
          usedAt: code.usedAt ?? null,
        },
      });
    return code;
  }

  async findById(id: string): Promise<InviteCode | undefined> {
    const rows = await this.db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.id, id));
    return this.toDomain(rows[0]);
  }

  async findByCode(code: string): Promise<InviteCode | undefined> {
    const rows = await this.db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, code));
    return this.toDomain(rows[0]);
  }

  async findAll(): Promise<ReadonlyArray<InviteCode>> {
    const rows = await this.db.select().from(inviteCodes);
    return rows
      .map((row) => this.toDomain(row))
      .filter((code): code is InviteCode => code !== undefined);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(inviteCodes).where(eq(inviteCodes.id, id));
  }

  private toDomain(
    row: typeof inviteCodes.$inferSelect | undefined,
  ): InviteCode | undefined {
    if (!row) return undefined;
    if (!isInviteCodeStatus(row.status)) {
      throw new Error(
        `Corrupted DB data: invalid invite code status '${row.status}'`,
      );
    }
    return new InviteCode(
      row.id,
      row.code,
      row.createdBy,
      row.status,
      row.createdAt,
      row.expiresAt ?? undefined,
      row.usedBy ?? undefined,
      row.usedAt ?? undefined,
    );
  }
}
