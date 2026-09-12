import { UnauthorizedException } from '@nestjs/common';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { interactiveAuthMaxAgeMs } from '@shared/auth/interactive-auth-window';

export const assertFreshInteractiveAuth = (
  user: CurrentUserPayload,
  now = Date.now(),
): void => {
  if (
    !Number.isSafeInteger(now) ||
    user.authTime === undefined ||
    !Number.isSafeInteger(user.authTime) ||
    user.authTime < 0 ||
    (user.amr !== 'password' && user.amr !== 'webauthn') ||
    now - user.authTime > interactiveAuthMaxAgeMs ||
    now < user.authTime
  )
    throw new UnauthorizedException('step-up-required');
};
