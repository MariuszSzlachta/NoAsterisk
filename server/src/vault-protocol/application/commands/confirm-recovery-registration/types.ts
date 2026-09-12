import type { CurrentUserPayload } from '@shared/auth/current-user';
import type { ConfirmRecoveryRegistration } from '@vault-protocol/domain/recovery-registration/types';

export interface ConfirmRecoveryRegistrationCommand extends Omit<
  ConfirmRecoveryRegistration,
  'userId' | 'workspaceId'
> {
  readonly user: CurrentUserPayload;
}
