import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { User } from '@auth/domain/user.entity';
import { UserRole } from '@auth/domain/user-role.enum';
import { UserRepository } from '@auth/domain/ports/user.repository';
import { UserPreferences } from '@auth/domain/user-preferences.vo';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { users } from '@shared/infrastructure/database/schema';

const VALID_ROLES = new Set(Object.values(UserRole));

@Injectable()
export class PostgresUserRepository implements UserRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async save(user: User): Promise<User> {
    await this.db
      .insert(users)
      .values({
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        workspaceId: user.workspaceId,
        createdAt: user.createdAt,
        displayName: user.displayName ?? null,
        preferences: user.preferences,
        tokenVersion: user.tokenVersion,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          passwordHash: user.passwordHash,
          role: user.role,
          displayName: user.displayName ?? null,
          preferences: user.preferences,
          tokenVersion: user.tokenVersion,
        },
      });
    return user;
  }

  async findById(id: string): Promise<User | undefined> {
    const rows = await this.db.select().from(users).where(eq(users.id, id));
    return this.toDomain(rows[0]);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return this.toDomain(rows[0]);
  }

  async findAll(): Promise<ReadonlyArray<User>> {
    const rows = await this.db.select().from(users);
    return rows
      .map((row) => this.toDomain(row))
      .filter((user): user is User => user !== undefined);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return rows.length > 0;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  private toDomain(
    row: typeof users.$inferSelect | undefined,
  ): User | undefined {
    if (!row) return undefined;
    if (!VALID_ROLES.has(row.role as UserRole)) {
      throw new Error(`Corrupted DB data: invalid user role '${row.role}'`);
    }
    return new User(
      row.id,
      row.email,
      row.passwordHash,
      row.role as UserRole,
      row.workspaceId,
      row.createdAt,
      row.displayName ?? undefined,
      row.preferences as UserPreferences,
      row.tokenVersion,
    );
  }
}
