import { WebauthnCredentialHandler } from '@vault-protocol/application/webauthn-credential.handler';
import type { PasskeyUserRepository } from '@vault-protocol/domain/ports/passkey-user.repository';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import type { WebauthnChallengeStorePort } from '@vault-protocol/domain/ports/webauthn-challenge.store';
import type { WebauthnCredentialRepository } from '@vault-protocol/domain/ports/webauthn-credential.repository';
import type { WebauthnVerifierPort } from '@vault-protocol/domain/ports/webauthn-verifier.port';
import type { TokenPort } from '@auth/domain/ports/token.port';
import type { WebauthnRegistrationPort } from '@vault-protocol/domain/ports/webauthn-registration.port';

const user: CurrentUserPayload = {
  userId: 'user-1',
  workspaceId: 'workspace-1',
  role: 'Member',
  authTime: Date.now(),
  amr: 'password',
};

describe('WebauthnCredentialHandler', () => {
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
  const verifier: WebauthnVerifierPort = {
    verify: jest.fn(),
  };
  const registration: WebauthnRegistrationPort = {
    createOptions: jest.fn(),
    verifyRegistration: jest.fn(),
  };
  const token: TokenPort = {
    sign: jest.fn(() => 'access-token'),
    signRefresh: jest.fn(() => 'refresh-token'),
    verify: jest.fn(),
    verifyRefresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(users.findById).mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
      role: 'Member',
      workspaceId: 'workspace-1',
      tokenVersion: 0,
    });
    jest.mocked(challenges.create).mockResolvedValue({
      userId: 'user-1',
      vaultId: 'vault-1',
      deviceId: 'device-1',
      type: 'registration',
      challenge: 'challenge-1',
      expiresAt: Date.now() + 60_000,
    });
    jest.mocked(credentials.listActiveByUserId).mockResolvedValue([]);
    jest
      .mocked(registration.createOptions)
      .mockResolvedValue({ challenge: 'challenge-1' });
  });

  it('creates registration options with required user verification and PRF request', async () => {
    const handler = new WebauthnCredentialHandler(
      users,
      challenges,
      credentials,
      verifier,
      registration,
      token,
    );
    await handler.createRegistrationOptions(user, {
      vaultId: 'vault-1',
      deviceId: 'device-1',
    });

    expect(registration.createOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        challenge: 'challenge-1',
        rpId: expect.any(String),
      }),
    );
  });

  it('rejects registration options when the authenticated account is missing', async () => {
    jest.mocked(users.findById).mockResolvedValue(undefined);
    const handler = new WebauthnCredentialHandler(
      users,
      challenges,
      credentials,
      verifier,
      registration,
      token,
    );

    await expect(
      handler.createRegistrationOptions(user, {
        vaultId: 'vault-1',
        deviceId: 'device-1',
      }),
    ).rejects.toThrow('Unable to create WebAuthn options');
    expect(challenges.create).not.toHaveBeenCalled();
  });

  it('stores only the verified public key and counter', async () => {
    jest.mocked(challenges.consume).mockResolvedValue({
      userId: 'user-1',
      vaultId: 'vault-1',
      deviceId: 'device-1',
      type: 'registration',
      challenge: 'challenge-1',
      expiresAt: Date.now() + 60_000,
    });
    jest.mocked(registration.verifyRegistration).mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: 'credential-1',
          publicKey: new Uint8Array(new ArrayBuffer(32)),
          counter: 0,
          transports: ['internal'],
        },
        userVerified: true,
        origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
        rpID: process.env['WEBAUTHN_RP_ID'] ?? 'localhost',
      },
    });

    const handler = new WebauthnCredentialHandler(
      users,
      challenges,
      credentials,
      verifier,
      registration,
      token,
    );
    await handler.verifyRegistration(user, {
      vaultId: 'vault-1',
      deviceId: 'device-1',
      challenge: 'challenge-1',
      credential: {
        id: 'credential-1',
        rawId: 'raw',
        type: 'public-key',
        response: {
          clientDataJSON: 'client',
          attestationObject: 'attestation',
        },
        clientExtensionResults: {},
      },
    });

    expect(credentials.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        credentialId: 'credential-1',
        counter: 0,
        supportsPrf: false,
      }),
    );
  });

  it('rejects unverified or policy-violating registrations', async () => {
    jest.mocked(challenges.consume).mockResolvedValue({
      userId: 'user-1',
      vaultId: 'vault-1',
      deviceId: 'device-1',
      type: 'registration',
      challenge: 'challenge-1',
      expiresAt: Date.now() + 60_000,
    });
    const request: Parameters<
      WebauthnCredentialHandler['verifyRegistration']
    >[1] = {
      vaultId: 'vault-1',
      deviceId: 'device-1',
      challenge: 'challenge-1',
      credential: {
        id: 'credential-1',
        rawId: 'raw',
        type: 'public-key',
        response: {
          clientDataJSON: 'client',
          attestationObject: 'attestation',
        },
        clientExtensionResults: {},
      },
    };
    const handler = new WebauthnCredentialHandler(
      users,
      challenges,
      credentials,
      verifier,
      registration,
      token,
    );

    jest
      .mocked(registration.verifyRegistration)
      .mockResolvedValue({ verified: false });
    await expect(handler.verifyRegistration(user, request)).rejects.toThrow(
      'WebAuthn registration rejected',
    );

    jest.mocked(registration.verifyRegistration).mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: 'credential-1',
          publicKey: new Uint8Array(new ArrayBuffer(32)),
          counter: 0,
          transports: [],
        },
        userVerified: false,
        origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
        rpID: process.env['WEBAUTHN_RP_ID'] ?? 'localhost',
      },
    });
    await expect(handler.verifyRegistration(user, request)).rejects.toThrow(
      'WebAuthn registration policy rejected',
    );
  });

  it('rejects an authentication assertion carrying another account user handle', async () => {
    jest.mocked(challenges.consume).mockResolvedValue({
      userId: 'user-1',
      vaultId: 'vault-1',
      deviceId: 'device-1',
      type: 'authentication',
      challenge: 'challenge-1',
      expiresAt: Date.now() + 60_000,
    });
    jest.mocked(credentials.findActiveByCredentialId).mockResolvedValue({
      id: 'credential-row',
      userId: 'user-1',
      credentialId: 'credential-1',
      publicKey: new Uint8Array(new ArrayBuffer(32)),
      counter: 0,
      transports: ['internal'],
      supportsPrf: false,
    });

    const handler = new WebauthnCredentialHandler(
      users,
      challenges,
      credentials,
      verifier,
      registration,
      token,
    );

    await expect(
      handler.verifyAuthentication(user, {
        vaultId: 'vault-1',
        deviceId: 'device-1',
        challenge: 'challenge-1',
        assertion: {
          id: 'credential-1',
          rawId: 'raw',
          type: 'public-key',
          response: {
            clientDataJSON: 'client',
            authenticatorData: 'authenticator',
            signature: 'signature',
            userHandle: Buffer.from('another-user', 'utf8').toString(
              'base64url',
            ),
          },
        },
      }),
    ).rejects.toThrow('WebAuthn assertion rejected');
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  it('lists public credential metadata and completes verified authentication', async () => {
    jest.mocked(credentials.listActiveByUserId).mockResolvedValue([
      {
        id: 'credential-row',
        userId: 'user-1',
        credentialId: 'credential-1',
        publicKey: new Uint8Array(new ArrayBuffer(32)),
        counter: 2,
        transports: ['internal'],
        supportsPrf: true,
      },
    ]);
    await expect(
      new WebauthnCredentialHandler(
        users,
        challenges,
        credentials,
        verifier,
        registration,
        token,
      ).list(user),
    ).resolves.toEqual([
      {
        credentialId: 'credential-1',
        transports: ['internal'],
        supportsPrf: true,
      },
    ]);

    jest.mocked(challenges.consume).mockResolvedValue({
      userId: 'user-1',
      vaultId: 'vault-1',
      deviceId: 'device-1',
      type: 'authentication',
      challenge: 'challenge-1',
      expiresAt: Date.now() + 60_000,
    });
    jest.mocked(credentials.findActiveByCredentialId).mockResolvedValue({
      id: 'credential-row',
      userId: 'user-1',
      credentialId: 'credential-1',
      publicKey: new Uint8Array(new ArrayBuffer(32)),
      counter: 2,
      transports: ['internal'],
      supportsPrf: true,
    });
    jest.mocked(verifier.verify).mockResolvedValue({
      credentialId: 'credential-1',
      newCounter: 3,
    });
    await new WebauthnCredentialHandler(
      users,
      challenges,
      credentials,
      verifier,
      registration,
      token,
    ).verifyAuthentication(user, {
      vaultId: 'vault-1',
      deviceId: 'device-1',
      challenge: 'challenge-1',
      assertion: {
        id: 'credential-1',
        rawId: 'raw',
        type: 'public-key',
        response: {
          clientDataJSON: 'client',
          authenticatorData: 'authenticator',
          signature: 'signature',
        },
      },
    });
    expect(credentials.updateCounter).toHaveBeenCalledWith('credential-1', 3);

    const handler = new WebauthnCredentialHandler(
      users,
      challenges,
      credentials,
      verifier,
      registration,
      token,
    );
    await handler.revoke(user, 'credential-1');
    expect(credentials.revoke).toHaveBeenCalledWith('user-1', 'credential-1');
  });

  it('rejects authentication for a missing or foreign credential', async () => {
    jest.mocked(challenges.consume).mockResolvedValue({
      userId: 'user-1',
      vaultId: 'vault-1',
      deviceId: 'device-1',
      type: 'authentication',
      challenge: 'challenge-1',
      expiresAt: Date.now() + 60_000,
    });
    jest
      .mocked(credentials.findActiveByCredentialId)
      .mockResolvedValue(undefined);
    const handler = new WebauthnCredentialHandler(
      users,
      challenges,
      credentials,
      verifier,
      registration,
      token,
    );

    await expect(
      handler.verifyAuthentication(user, {
        vaultId: 'vault-1',
        deviceId: 'device-1',
        challenge: 'challenge-1',
        assertion: {
          id: 'missing',
          rawId: 'raw',
          type: 'public-key',
          response: {
            clientDataJSON: 'client',
            authenticatorData: 'authenticator',
            signature: 'signature',
          },
        },
      }),
    ).rejects.toThrow('WebAuthn assertion rejected');
  });
});
