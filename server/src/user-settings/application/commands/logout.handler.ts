import { Injectable } from '@nestjs/common';
import { DomainError } from '@budget/domain';

export interface LogoutCommand {
  userId: string;
}

export interface LogoutResult {
  success: true;
}

/**
 * V1: Stateless JWT — client discards token, backend is no-op.
 * V2 (planned): Token blacklist with Redis/DB, TTL = accessToken expiry.
 */
@Injectable()
export class LogoutHandler {
  async execute(command: LogoutCommand): Promise<LogoutResult> {
    if (!command.userId) {
      throw new DomainError('User ID is required for logout');
    }
    // TODO: Token blacklist in persistence phase (Redis/DB)
    return { success: true };
  }
}
