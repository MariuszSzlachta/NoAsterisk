import {
  Permission,
  ResourceType,
  Action,
} from '@auth/domain/permission.entity';

// ARCH-EXCEPTION: global-scope — permissions are user-scoped ACL records, not tenant-root records.

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
  deleteByUserId(userId: string): Promise<void>;
}
