import { WebauthnChallengeStore } from '@vault-protocol/infrastructure/webauthn-challenge.store';

describe('WebauthnChallengeStore', () => {
  const input: Parameters<WebauthnChallengeStore['create']>[0] = {
    userId: 'user',
    vaultId: 'vault',
    deviceId: 'device',
    type: 'authentication',
  };

  it('creates a random short-lived challenge bound to its context', () => {
    const store = new WebauthnChallengeStore();
    const record = store.create(input, 1000);
    expect(record.challenge).toHaveLength(43);
    expect(store.consume(record.challenge, input, 1001)).toEqual(record);
  });

  it('is one-time, context-bound and expires', () => {
    const store = new WebauthnChallengeStore();
    const record = store.create(input, 1000);
    store.consume(record.challenge, input, 1001);
    expect(() => store.consume(record.challenge, input, 1001)).toThrow();
    const next = store.create(input, 1000);
    expect(() =>
      store.consume(next.challenge, { ...input, deviceId: 'other' }, 1001),
    ).toThrow();
    const expired = store.create(input, 1000);
    expect(() => store.consume(expired.challenge, input, 61_001)).toThrow();
  });

  it('supports account login challenges without vault scope', () => {
    const store = new WebauthnChallengeStore();
    const login = {
      userId: 'user',
      deviceId: 'auth-passkey-login',
      type: 'login' as const,
    };
    const record = store.create(login, 1000);
    expect(store.consume(record.challenge, login, 1001)).toEqual(record);
  });
});
