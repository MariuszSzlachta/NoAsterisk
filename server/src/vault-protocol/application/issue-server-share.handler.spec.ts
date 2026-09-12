import { ForbiddenException } from '@nestjs/common';
import { IssueServerShareHandler } from '@vault-protocol/application/issue-server-share.handler';
import { InMemoryServerShareRepository } from '@vault-protocol/infrastructure/in-memory-server-share.repository';
import type { CurrentUserPayload } from '@auth/presentation/decorators/current-user.decorator';

describe('IssueServerShareHandler', () => {
  const user: CurrentUserPayload = {
    userId: 'user',
    workspaceId: 'workspace',
    role: 'member',
    authTime: Date.now(),
    amr: 'password',
  };

  it('issues a transient 32-byte share only after fresh auth', async () => {
    const repository = new InMemoryServerShareRepository();
    await repository.enroll(user.userId, user.workspaceId, 'device');
    const handler = new IssueServerShareHandler(repository);
    const result = await handler.execute({ user, deviceId: 'device' });
    expect(Buffer.from(result.serverShare, 'base64')).toHaveLength(32);
    expect(result.expiresAt).toEqual(expect.any(String));
  });

  it('rejects stale auth and unknown devices without issuing material', async () => {
    const repository = new InMemoryServerShareRepository();
    const handler = new IssueServerShareHandler(repository);
    await expect(
      handler.execute({
        user: { ...user, authTime: Date.now() - 6 * 60 * 1000 },
        deviceId: 'device',
      }),
    ).rejects.toThrow('step-up-required');
    await expect(handler.execute({ user, deviceId: '' })).rejects.toThrow(
      ForbiddenException,
    );
    await expect(
      handler.execute({ user, deviceId: 'unregistered-device' }),
    ).rejects.toThrow('Device enrollment required');
  });
});
