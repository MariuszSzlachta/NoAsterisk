import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { assertFreshInteractiveAuth } from '@shared/auth/auth-freshness';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import {
  SERVER_SHARE_REPOSITORY,
  type ServerShareRepository,
} from '@vault-protocol/domain/ports/server-share.repository';

interface IssueServerShareCommand {
  readonly user: CurrentUserPayload;
  readonly deviceId: string;
}

interface IssueServerShareResult {
  readonly serverShare: string;
  readonly expiresAt: string;
}

const SHARE_TTL_MS = 60_000;

@Injectable()
export class IssueServerShareHandler {
  constructor(
    @Inject(SERVER_SHARE_REPOSITORY)
    private readonly repository: ServerShareRepository,
  ) {}

  async execute(
    command: IssueServerShareCommand,
  ): Promise<IssueServerShareResult> {
    assertFreshInteractiveAuth(command.user);
    if (command.deviceId.length === 0)
      throw new ForbiddenException('Device enrollment required');
    const share = await this.repository.issue(
      command.user.userId,
      command.user.workspaceId,
      command.deviceId,
    );
    if (share === undefined)
      throw new ForbiddenException('Device enrollment required');
    return {
      serverShare: Buffer.from(share).toString('base64'),
      expiresAt: new Date(Date.now() + SHARE_TTL_MS).toISOString(),
    };
  }
}
