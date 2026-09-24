import type { CurrentUserPayload } from '@shared/auth/current-user';
import type { PrepareDualRootRotationRequest } from '@vault-protocol/domain/ports/dual-root-rotation';

export interface PrepareDualRootRotationCommand extends Omit<
  PrepareDualRootRotationRequest,
  'userId' | 'workspaceId'
> {
  readonly user: CurrentUserPayload;
}
