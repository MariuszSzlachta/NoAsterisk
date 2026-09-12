import type { CurrentUserPayload } from '@shared/auth/current-user';
import type { SignedEnrollmentConfirmation } from '@vault-protocol/domain/entities/signed-enrollment';
export interface ConfirmSignedEnrollmentCommand {
  readonly user: CurrentUserPayload;
  readonly request: Omit<
    SignedEnrollmentConfirmation,
    'accountId' | 'workspaceId' | 'authDeadline'
  >;
}
