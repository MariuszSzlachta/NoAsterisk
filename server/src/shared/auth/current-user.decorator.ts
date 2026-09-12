import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CurrentUserPayload } from '@shared/auth/current-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserPayload =>
    context.switchToHttp().getRequest<{ user: CurrentUserPayload }>().user,
);
