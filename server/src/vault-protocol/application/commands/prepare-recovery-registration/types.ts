import type { CurrentUserPayload } from '@shared/auth/current-user';
import type { PrepareRecoveryRegistration } from '@vault-protocol/domain/recovery-registration/types';

export interface PrepareRecoveryRegistrationCommand extends Omit<
  PrepareRecoveryRegistration,
  'userId' | 'workspaceId'
> {
  readonly user: CurrentUserPayload;
}
