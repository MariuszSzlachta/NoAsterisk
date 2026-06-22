import { Injectable } from '@nestjs/common';
import { Permission, ResourceType, Action } from '@auth/domain/permission.entity';
import { PermissionRepository } from '@auth/domain/ports/permission.repository';

@Injectable()
export class InMemoryPermissionRepository implements PermissionRepository {
  private readonly store = new Map<string, Permission>();

  async save(permission: Permission): Promise<Permission> {
    this.store.set(permission.id, permission);
    return permission;
  }

  async findByUserAndResource(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
  ): Promise<Permission | undefined> {
    return [...this.store.values()].find(
      (p) =>
        p.userId === userId &&
        p.resourceType === resourceType &&
        p.resourceId === resourceId,
    );
  }

  async hasPermission(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    action: Action,
  ): Promise<boolean> {
    const permission = await this.findByUserAndResource(userId, resourceType, resourceId);
    return permission ? permission.hasAction(action) : false;
  }
}
