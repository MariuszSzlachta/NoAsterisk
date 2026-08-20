import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_REPOSITORY,
  PermissionRepository,
} from '@auth/domain/ports/permission.repository';
import {
  REQUIRED_PERMISSION_KEY,
  RequiredPermission,
} from '@auth/presentation/decorators/require-permission.decorator';
import { CurrentUserPayload } from '@auth/presentation/decorators/current-user.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepo: PermissionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<
      RequiredPermission | undefined
    >(REQUIRED_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!required) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: CurrentUserPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (required.resourceType !== 'workspace') {
      // Only workspace-level permission checks are supported in MVP.
      // When sub_budget or account-level permissions are needed (Phase 5),
      // extend RequiredPermission to specify which request param holds the resourceId.
      throw new ForbiddenException('Insufficient permissions');
    }

    const hasPermission = await this.permissionRepo.hasPermission(
      user.userId,
      required.resourceType,
      user.workspaceId,
      required.action,
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
