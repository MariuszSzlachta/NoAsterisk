import { SetMetadata } from '@nestjs/common';
import type { Action, ResourceType } from '@auth/domain/permission.entity';

export const REQUIRED_PERMISSION_KEY = 'requiredPermission';

export interface RequiredPermission {
  readonly resourceType: ResourceType;
  readonly action: Action;
}

export const RequirePermission = (
  permission: RequiredPermission,
): ReturnType<typeof SetMetadata> =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);
