import type { CurrentUserPayload } from '@shared/auth/current-user';
import type { SignedEnrollmentInput } from '@vault-protocol/domain/entities/signed-enrollment';

export type PrepareSignedEnrollmentCommand = {
  readonly user: CurrentUserPayload;
  readonly recoveryConfirmed: boolean;
  readonly intent:
    | Omit<
        Extract<SignedEnrollmentInput, { purpose: 'trusted' }>,
        'accountId' | 'workspaceId'
      >
    | Omit<
        Extract<SignedEnrollmentInput, { purpose: 'initial' | 'recovery' }>,
        'accountId' | 'workspaceId'
      >;
};
