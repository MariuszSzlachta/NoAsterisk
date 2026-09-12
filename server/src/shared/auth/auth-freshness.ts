import { UnauthorizedException } from '@nestjs/common';
import type { CurrentUserPayload } from '@shared/auth/current-user';

const INTERACTIVE_AUTH_MAX_AGE_MS = 5 * 60 * 1000;

export const assertFreshInteractiveAuth = (
  user: CurrentUserPayload,
  now = Date.now(),
): void => {
  if (
    user.authTime === undefined ||
    user.amr === undefined ||
    now - user.authTime > INTERACTIVE_AUTH_MAX_AGE_MS ||
    now < user.authTime
  )
    throw new UnauthorizedException('step-up-required');
};
