import { WebauthnChallengeHandler } from '@vault-protocol/application/webauthn-challenge.handler';
import type { WebauthnChallengeStorePort } from '@vault-protocol/domain/ports/webauthn-challenge.store';

describe('WebauthnChallengeHandler', () => {
  it('creates a challenge with the authenticated account and device binding', async () => {
    const store: WebauthnChallengeStorePort = {
      create: jest.fn().mockResolvedValue({
        challenge: 'challenge-1',
        userId: 'user-1',
        vaultId: 'vault-1',
        deviceId: 'device-1',
        type: 'registration',
        expiresAt: Date.now() + 60_000,
      }),
      consume: jest.fn(),
    };
    const handler = new WebauthnChallengeHandler(store);

    await expect(
      handler.create({
        userId: 'user-1',
        vaultId: 'vault-1',
        deviceId: 'device-1',
        type: 'registration',
      }),
    ).resolves.toMatchObject({ challenge: 'challenge-1' });
    expect(store.create).toHaveBeenCalledWith({
      userId: 'user-1',
      vaultId: 'vault-1',
      deviceId: 'device-1',
      type: 'registration',
    });
  });

  it('propagates a failed challenge creation without exposing or transforming it', async () => {
    const error = new Error('challenge unavailable');
    const store: WebauthnChallengeStorePort = {
      create: jest.fn().mockRejectedValue(error),
      consume: jest.fn(),
    };
    const handler = new WebauthnChallengeHandler(store);

    await expect(
      handler.create({
        userId: 'user-1',
        vaultId: 'vault-1',
        deviceId: 'device-1',
        type: 'authentication',
      }),
    ).rejects.toBe(error);
  });
});
