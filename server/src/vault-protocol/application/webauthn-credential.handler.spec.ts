import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { WebauthnCredentialHandler } from '@vault-protocol/application/webauthn-credential.handler';
import type { UserRepository } from '@auth/domain/ports/user.repository';
import type { WebauthnChallengeStorePort } from '@vault-protocol/domain/ports/webauthn-challenge.store';
import type { WebauthnCredentialRepository } from '@vault-protocol/domain/ports/webauthn-credential.repository';
import type { WebauthnVerifierAdapter } from '@vault-protocol/infrastructure/webauthn-verifier.adapter';

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
}));

const user = {
  userId: 'user-1',
  workspaceId: 'workspace-1',
  role: 'Member',
  authTime: Date.now(),
  amr: 'password' as const,
};

describe('WebauthnCredentialHandler', () => {
  const users: UserRepository = {
    findById: jest.fn(),
    save: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    existsByEmail: jest.fn(),
    delete: jest.fn(),
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
  const verifier = {
    verify: jest.fn(),
  } as unknown as WebauthnVerifierAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(users.findById).mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
      passwordHash: 'hash',
      role: 'Member' as never,
      workspaceId: 'workspace-1',
      createdAt: new Date(),
    } as never);
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
      .mocked(generateRegistrationOptions)
      .mockResolvedValue({ challenge: 'challenge-1' } as never);
  });

  it('creates registration options with required user verification and PRF request', async () => {
    const handler = new WebauthnCredentialHandler(
      users,
      challenges,
      credentials,
      verifier,
    );
    await handler.createRegistrationOptions(user, {
      vaultId: 'vault-1',
      deviceId: 'device-1',
    });

    expect(generateRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        challenge: 'challenge-1',
        rpID: expect.any(String),
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'required',
        },
        extensions: { prf: {} },
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
    jest.mocked(verifyRegistrationResponse).mockResolvedValue({
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
    } as never);

    const handler = new WebauthnCredentialHandler(
      users,
      challenges,
      credentials,
      verifier,
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
    const request = {
      vaultId: 'vault-1',
      deviceId: 'device-1',
      challenge: 'challenge-1',
      credential: {
        id: 'credential-1',
        rawId: 'raw',
        type: 'public-key' as const,
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
    );

    jest
      .mocked(verifyRegistrationResponse)
      .mockResolvedValue({ verified: false } as never);
    await expect(handler.verifyRegistration(user, request)).rejects.toThrow(
      'WebAuthn registration rejected',
    );

    jest.mocked(verifyRegistrationResponse).mockResolvedValue({
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
    } as never);
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
