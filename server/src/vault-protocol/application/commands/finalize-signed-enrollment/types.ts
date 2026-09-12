import type { CurrentUserPayload } from '@shared/auth/current-user';
import type { SignedEnrollmentFinalization } from '@vault-protocol/domain/entities/signed-enrollment';

export interface FinalizeSignedEnrollmentCommand {
  readonly user: CurrentUserPayload;
  readonly request:
    | Omit<
        Extract<SignedEnrollmentFinalization, { purpose: 'trusted' }>,
        'accountId' | 'workspaceId' | 'authDeadline'
      >
    | Omit<
        Extract<
          SignedEnrollmentFinalization,
          { purpose: 'initial' | 'recovery' }
        >,
        'accountId' | 'workspaceId' | 'authDeadline'
      >;
}
