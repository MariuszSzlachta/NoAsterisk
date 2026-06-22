import { Permission, ResourceType, Action } from '@auth/domain/permission.entity';

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');

export interface PermissionRepository {
  save(permission: Permission): Promise<Permission>;
  findByUserAndResource(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
  ): Promise<Permission | undefined>;
  hasPermission(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    action: Action,
  ): Promise<boolean>;
}
