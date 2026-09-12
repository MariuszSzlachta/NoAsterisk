import { Injectable } from '@nestjs/common';
import type { ServerShareRepository } from '@vault-protocol/domain/ports/server-share.repository';
import { InMemoryVaultProtocolState } from './in-memory-vault-protocol-state';

@Injectable()
export class InMemoryServerShareRepository implements ServerShareRepository {
  constructor(
    private readonly state: InMemoryVaultProtocolState = new InMemoryVaultProtocolState(),
  ) {}

  enroll(userId: string, workspaceId: string, deviceId: string): Promise<void> {
    if ([userId, workspaceId, deviceId].some((value) => value.length === 0))
      return Promise.resolve();
    this.state.seedServerShare(userId, workspaceId, deviceId);
    return Promise.resolve();
  }

  issue(
    userId: string,
    workspaceId: string,
    deviceId: string,
  ): Promise<Uint8Array | undefined> {
    if ([userId, workspaceId, deviceId].some((value) => value.length === 0))
      return Promise.resolve(undefined);
    return Promise.resolve(
      this.state.issueServerShare(userId, workspaceId, deviceId),
    );
  }
}
