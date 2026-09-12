import { UnauthorizedException } from '@nestjs/common';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { assertFreshInteractiveAuth } from '@shared/auth/assert-fresh-interactive-auth';

export const assertFreshVaultUnlockGrant = (
  user: CurrentUserPayload,
  now = Date.now(),
): void => {
  assertFreshInteractiveAuth(user, now);
  if (user.vaultUnlockGrant === undefined || user.vaultUnlockGrant.length === 0)
    throw new UnauthorizedException('step-up-required');
};
