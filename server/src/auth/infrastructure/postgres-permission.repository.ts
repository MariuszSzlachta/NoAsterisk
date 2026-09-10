import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { Permission } from '@auth/domain/permission.entity';
import type { Action, ResourceType } from '@auth/domain/permission.entity';
import { PermissionRepository } from '@auth/domain/ports/permission.repository';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import { permissions } from '@shared/infrastructure/database/schema';
import { permissionValueGuards } from '@auth/infrastructure/persistence/permission-value-guards';

@Injectable()
export class PostgresPermissionRepository implements PermissionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async save(permission: Permission): Promise<Permission> {
    await this.db
      .insert(permissions)
      .values({
        id: permission.id,
        userId: permission.userId,
        resourceType: permission.resourceType,
        resourceId: permission.resourceId,
        actions: permission.actions,
        createdAt: permission.createdAt,
      })
      .onConflictDoUpdate({
        target: permissions.id,
        set: {
          actions: permission.actions,
        },
      });
    return permission;
  }

  async findByUserAndResource(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
  ): Promise<Permission | undefined> {
    const rows = await this.db
      .select()
      .from(permissions)
      .where(
        and(
          eq(permissions.userId, userId),
          eq(permissions.resourceType, resourceType),
          eq(permissions.resourceId, resourceId),
        ),
      );
    return this.toDomain(rows[0]);
  }

  async hasPermission(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    action: Action,
  ): Promise<boolean> {
    const permission = await this.findByUserAndResource(
      userId,
      resourceType,
      resourceId,
    );
    if (!permission) return false;
    return permission.hasAction(action);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db.delete(permissions).where(eq(permissions.userId, userId));
  }

  private toDomain(
    row: typeof permissions.$inferSelect | undefined,
  ): Permission | undefined {
    if (!row) return undefined;
    if (!permissionValueGuards.isResourceType(row.resourceType)) {
      throw new Error(
        `Corrupted DB data: invalid permission resource '${row.resourceType}'`,
      );
    }
    if (!permissionValueGuards.isActionList(row.actions)) {
      throw new Error('Corrupted DB data: invalid permission actions');
    }
    return new Permission(
      row.id,
      row.userId,
      row.resourceType,
      row.resourceId,
      row.actions,
      row.createdAt,
    );
  }
}
