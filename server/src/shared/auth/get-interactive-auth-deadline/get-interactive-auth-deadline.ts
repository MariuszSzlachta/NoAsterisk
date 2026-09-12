import { UnauthorizedException } from '@nestjs/common';
import { assertFreshInteractiveAuth } from '@shared/auth/auth-freshness';
import { interactiveAuthMaxAgeMs } from '@shared/auth/interactive-auth-window';
import type { CurrentUserPayload } from '@shared/auth/current-user';

export const getInteractiveAuthDeadline = (
  user: CurrentUserPayload,
): number => {
  assertFreshInteractiveAuth(user);
  if (user.authTime === undefined)
    throw new UnauthorizedException('step-up-required');
  return user.authTime + interactiveAuthMaxAgeMs;
};
