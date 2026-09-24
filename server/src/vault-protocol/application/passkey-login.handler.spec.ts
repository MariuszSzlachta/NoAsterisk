import { PasskeyLoginHandler } from '@vault-protocol/application/passkey-login.handler';
import type {
  PasskeyUser,
  PasskeyUserRepository,
} from '@vault-protocol/domain/ports/passkey-user.repository';
import type { TokenPort } from '@auth/domain/ports/token.port';
import type { WebauthnChallengeStorePort } from '@vault-protocol/domain/ports/webauthn-challenge.store';
import type { WebauthnCredentialRepository } from '@vault-protocol/domain/ports/webauthn-credential.repository';
import type { WebauthnVerifierPort } from '@vault-protocol/domain/ports/webauthn-verifier.port';
import type { WebauthnAuthenticationOptionsPort } from '@vault-protocol/domain/ports/webauthn-authentication-options.port';

describe('PasskeyLoginHandler', () => {
  const users: PasskeyUserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
  };
  const challenges: WebauthnChallengeStorePort = {
    create: jest.fn(),
    consume: jest.fn(),
  };
  const credentials: WebauthnCredentialRepository = {
    create: jest.fn(),
    findActiveByCredentialId: jest.fn(),
    listActiveByUserId: jest.fn(),
    updateCounter: jest.fn(),
    revoke: jest.fn(),
  };
  const verifier: WebauthnVerifierPort = { verify: jest.fn() };
  const authenticationOptions: WebauthnAuthenticationOptionsPort = {
    createOptions: jest.fn(),
  };
  const token: TokenPort = {
    sign: jest.fn(() => 'access-token'),
    signRefresh: jest.fn(() => 'refresh-token'),
    verify: jest.fn(),
    verifyRefresh: jest.fn(),
  };

  const account: PasskeyUser = {
    id: 'user-1',
    email: 'owner@example.com',
    role: 'Member',
    workspaceId: 'workspace-1',
    tokenVersion: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(users.findByEmail).mockResolvedValue(account);
    jest.mocked(credentials.listActiveByUserId).mockResolvedValue([
      {
        id: 'credential-row',
        userId: 'user-1',
        credentialId: 'credential-1',
        publicKey: new Uint8Array(new ArrayBuffer(32)),
        counter: 4,
        transports: ['internal'],
        supportsPrf: false,
      },
    ]);
    jest.mocked(challenges.create).mockResolvedValue({
      challenge: 'login-challenge',
      userId: 'user-1',
      deviceId: 'auth-passkey-login',
      type: 'login',
      expiresAt: Date.now() + 60_000,
    });
    jest.mocked(authenticationOptions.createOptions).mockResolvedValue({
      challenge: 'login-challenge',
    });
  });

  it('creates a login challenge bound to the account without a vault identifier', async () => {
    const handler = new PasskeyLoginHandler(
      users,
      challenges,
      credentials,
      verifier,
      authenticationOptions,
      token,
    );

    await handler.createOptions(account.email);

    expect(challenges.create).toHaveBeenCalledWith({
      userId: 'user-1',
      deviceId: 'auth-passkey-login',
      type: 'login',
    });
    expect(authenticationOptions.createOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        challenge: 'login-challenge',
        rpId: expect.any(String),
      }),
    );
  });

  it('does not enumerate vault context during authentication options', async () => {
    const handler = new PasskeyLoginHandler(
      users,
      challenges,
      credentials,
      verifier,
      authenticationOptions,
      token,
    );

    await expect(
      handler.createOptions(account.email, 'device-1'),
    ).resolves.toEqual({
      challenge: 'login-challenge',
    });
  });

  it('verifies the assertion once and issues fresh WebAuthn session tokens', async () => {
    jest.mocked(challenges.consume).mockResolvedValue({
      challenge: 'login-challenge',
      userId: 'user-1',
      deviceId: 'auth-passkey-login',
      type: 'login',
      expiresAt: Date.now() + 60_000,
    });
    jest.mocked(credentials.findActiveByCredentialId).mockResolvedValue({
      id: 'credential-row',
      userId: 'user-1',
      credentialId: 'credential-1',
      publicKey: new Uint8Array(new ArrayBuffer(32)),
      counter: 4,
      transports: ['internal'],
      supportsPrf: false,
    });
    jest.mocked(verifier.verify).mockResolvedValue({
      credentialId: 'credential-1',
      newCounter: 5,
    });
    const handler = new PasskeyLoginHandler(
      users,
      challenges,
      credentials,
      verifier,
      authenticationOptions,
      token,
    );
    const assertion: Parameters<PasskeyLoginHandler['verify']>[2] = {
      id: 'credential-1',
      rawId: 'raw-id',
      type: 'public-key',
      response: {
        clientDataJSON: 'client-data',
        authenticatorData: 'authenticator-data',
        signature: 'signature',
      },
    };

    await expect(
      handler.verify(account.email, 'login-challenge', assertion),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'user-1', email: account.email },
    });
    expect(challenges.consume).toHaveBeenCalledWith('login-challenge', {
      userId: 'user-1',
      deviceId: 'auth-passkey-login',
      type: 'login',
    });
    expect(credentials.updateCounter).toHaveBeenCalledWith('credential-1', 5);
    expect(token.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        amr: 'webauthn',
        authTime: expect.any(Number),
      }),
    );
  });

  it('rejects an assertion carrying another account user handle', async () => {
    jest.mocked(challenges.consume).mockResolvedValue({
      challenge: 'login-challenge',
      userId: 'user-1',
      deviceId: 'auth-passkey-login',
      type: 'login',
      expiresAt: Date.now() + 60_000,
    });
    jest.mocked(credentials.findActiveByCredentialId).mockResolvedValue({
      id: 'credential-row',
      userId: 'user-1',
      credentialId: 'credential-1',
      publicKey: new Uint8Array(new ArrayBuffer(32)),
      counter: 4,
      transports: ['internal'],
      supportsPrf: false,
    });

    const handler = new PasskeyLoginHandler(
      users,
      challenges,
      credentials,
      verifier,
      authenticationOptions,
      token,
    );

    await expect(
      handler.verify(account.email, 'login-challenge', {
        id: 'credential-1',
        rawId: 'raw-id',
        type: 'public-key',
        response: {
          clientDataJSON: 'client-data',
          authenticatorData: 'authenticator-data',
          signature: 'signature',
          userHandle: Buffer.from('another-user', 'utf8').toString('base64url'),
        },
      }),
    ).rejects.toThrow('Passkey login rejected');
    expect(verifier.verify).not.toHaveBeenCalled();
  });
});
