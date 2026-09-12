export const SERVER_SHARE_REPOSITORY = Symbol('SERVER_SHARE_REPOSITORY');

export interface ServerShareRepository {
  enroll(userId: string, workspaceId: string, deviceId: string): Promise<void>;
  issue(
    userId: string,
    workspaceId: string,
    deviceId: string,
  ): Promise<Uint8Array | undefined>;
}
