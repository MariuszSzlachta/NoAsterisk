import { BadRequestException } from '@nestjs/common';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { PasskeyAuthController } from './passkey-auth.controller';
import { SyncSnapshotController } from './sync-snapshot.controller';
import { VaultBootstrapController } from './vault-bootstrap.controller';
import { VaultDeviceController } from './vault-device.controller';
import { VaultEnrollmentController } from './vault-enrollment.controller';
import { VaultProtocolController } from './vault-protocol.controller';
import { VaultSecurityController } from './vault-security.controller';
import { WebauthnChallengeController } from './webauthn-challenge.controller';
import { WebauthnCredentialController } from './webauthn-credential.controller';

const user: CurrentUserPayload = {
  userId: 'user-1',
  workspaceId: 'workspace-1',
  role: 'Member',
  authTime: Math.floor(Date.now() / 1000),
  amr: 'password',
};

const snapshot = {
  vaultId: 'vault-1',
  keyId: 'key-1',
  deviceId: 'device-1',
  revision: 1,
  previousEnvelopeHash: '',
  envelopeHash: 'hash-1',
  header: 'header',
  ciphertext: 'ciphertext',
  signature: 'signature',
  signingPublicKey: '{"kty":"EC","crv":"P-256","x":"public-x","y":"public-y"}',
  createdAt: '2026-09-12T00:00:00.000Z',
};

describe('Vault Protocol HTTP controller contracts', () => {
  it('maps passkey options and verification to public auth output and cookie', async () => {
    const handler = {
      createOptions: jest.fn().mockResolvedValue({ challenge: 'challenge' }),
      verify: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-1' },
      }),
    };
    const controller = new PasskeyAuthController(handler);
    const response = {
      cookie: jest.fn(),
      setHeader: jest.fn(),
    };

    await expect(
      controller.options({ email: 'user@example.com', deviceId: 'device-1' }),
    ).resolves.toEqual({
      challenge: 'challenge',
    });
    await expect(
      controller.verify(
        {
          email: 'user@example.com',
          challenge: 'challenge',
          assertion: {
            id: 'credential-1',
            rawId: 'cmF3',
            type: 'public-key',
            response: {
              clientDataJSON: 'Y2xpZW50',
              authenticatorData: 'YXV0aA',
              signature: 'c2ln',
            },
          },
        },
        response,
      ),
    ).resolves.toEqual({ accessToken: 'access-token', user: { id: 'user-1' } });
    expect(handler.verify).toHaveBeenCalledWith(
      'user@example.com',
      'challenge',
      expect.objectContaining({ id: 'credential-1' }),
    );
  });

  it('enforces sync vault context and revision before delegating', async () => {
    const handler = {
      get: jest.fn().mockResolvedValue({ status: 'empty' }),
      put: jest.fn().mockResolvedValue({
        status: 'saved',
        revision: 1,
        envelopeHash: 'hash-1',
      }),
    };
    const controller = new SyncSnapshotController(handler);

    await expect(controller.get(user, 'vault-1')).resolves.toEqual({
      status: 'empty',
    });
    expect(() =>
      controller.put(user, 'another-vault', undefined, snapshot),
    ).toThrow(BadRequestException);
    expect(() =>
      controller.put(user, 'vault-1', 'not-a-number', snapshot),
    ).toThrow('Invalid sync revision');
    await expect(
      controller.put(user, 'vault-1', '0', snapshot),
    ).resolves.toEqual({
      status: 'saved',
      revision: 1,
      envelopeHash: 'hash-1',
    });
    expect(handler.put).toHaveBeenCalledWith(
      'user-1',
      'workspace-1',
      snapshot,
      0,
    );
  });

  it('rejects missing device bootstrap context and forwards valid context', async () => {
    const handler = {
      execute: jest.fn().mockResolvedValue({ securityProfile: 'standard' }),
    };
    const controller = new VaultBootstrapController(handler);

    expect(() => controller.get(user)).toThrow('Device ID is required');
    await expect(controller.get(user, 'device-1')).resolves.toEqual({
      securityProfile: 'standard',
    });
    expect(handler.execute).toHaveBeenCalledWith(
      'user-1',
      'workspace-1',
      'device-1',
    );
  });

  it('lists and revokes only through the authenticated device handler', async () => {
    const handler = {
      list: jest.fn().mockResolvedValue([{ deviceId: 'device-1' }]),
      revoke: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new VaultDeviceController(handler);

    await expect(controller.list(user)).resolves.toEqual([
      { deviceId: 'device-1' },
    ]);
    await expect(controller.revoke(user, 'device-1')).resolves.toEqual({
      status: 'revoked',
    });
    expect(handler.revoke).toHaveBeenCalledWith(user, 'device-1');
  });

  it('binds enrollment operations to the authenticated account and workspace', async () => {
    const handler = {
      prepare: jest.fn().mockResolvedValue({ challenge: 'challenge' }),
      finalize: jest.fn().mockResolvedValue(undefined),
      confirm: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new VaultEnrollmentController(handler);
    const prepare: Parameters<VaultEnrollmentController['prepare']>[1] = {
      deviceId: 'device-2',
      recoveryConfirmed: true,
    };
    const finalize = {
      challenge: 'challenge',
      deviceId: 'device-2',
      vaultId: '00000000-0000-0000-0000-000000000001',
      keyId: 'key-2',
      deviceEnvelope: 'device-envelope',
      signingPublicKey: '{}',
    };
    const confirmation = {
      challenge: 'challenge',
      deviceId: 'device-2',
      vaultId: '00000000-0000-0000-0000-000000000001',
      keyId: 'key-2',
    };

    await expect(controller.prepare(user, prepare)).resolves.toEqual({
      challenge: 'challenge',
    });
    await expect(controller.finalize(user, finalize)).resolves.toBeUndefined();
    await expect(
      controller.confirm(user, confirmation),
    ).resolves.toBeUndefined();
    expect(handler.prepare).toHaveBeenCalledWith({ ...prepare, user });
    expect(handler.finalize).toHaveBeenCalledWith(user, {
      ...finalize,
      userId: 'user-1',
      workspaceId: 'workspace-1',
    });
    expect(handler.confirm).toHaveBeenCalledWith(user, {
      ...confirmation,
      userId: 'user-1',
      workspaceId: 'workspace-1',
    });
  });

  it('issues ServerShare and forwards rotation as an account-bound command', async () => {
    const issue = {
      execute: jest
        .fn()
        .mockResolvedValue({ serverShare: 'opaque', expiresAt: 'expiry' }),
    };
    const rotate = {
      execute: jest.fn().mockResolvedValue({ status: 'rotated' }),
    };
    const controller = new VaultProtocolController(issue, rotate);
    const command: Parameters<VaultProtocolController['rotate']>[1] = {
      vaultId: 'vault-1',
      deviceId: 'device-1',
      currentKeyId: 'key-1',
      nextKeyId: 'key-2',
      envelopePurpose: 'device-wrap',
      envelope: 'opaque-envelope',
      recoveryConfirmed: true,
      idempotencyKey: 'rotation-1',
    };

    await expect(
      controller.issue(user, { deviceId: 'device-1' }),
    ).resolves.toEqual({
      serverShare: 'opaque',
      expiresAt: 'expiry',
    });
    await expect(controller.rotate(user, command)).resolves.toEqual({
      status: 'rotated',
    });
    expect(issue.execute).toHaveBeenCalledWith({ user, deviceId: 'device-1' });
    expect(rotate.execute).toHaveBeenCalledWith({ user, ...command });
  });

  it('returns explicit security transition statuses', async () => {
    const handler = {
      execute: jest.fn().mockResolvedValue(undefined),
      enablePasskeyUnlock: jest.fn().mockResolvedValue(undefined),
      disable: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new VaultSecurityController(handler);
    const enable: Parameters<VaultSecurityController['enable']>[1] = {
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: 'passkey-envelope',
      recoveryConfirmed: true,
    };

    await expect(controller.enable(user, enable)).resolves.toEqual({
      status: 'enabled',
    });
    await expect(controller.enablePasskey(user, enable)).resolves.toEqual({
      status: 'enabled',
    });
    await expect(
      controller.disable(user, {
        vaultId: 'vault-1',
        keyId: 'key-1',
        deviceId: 'device-1',
        deviceEnvelope: 'device-envelope',
        recoveryConfirmed: true,
      }),
    ).resolves.toEqual({ status: 'disabled' });
    expect(handler.disable).toHaveBeenCalledWith({
      user,
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: 'device-envelope',
      recoveryConfirmed: true,
    });
  });

  it('formats WebAuthn challenges and converts handler failures to a safe error', async () => {
    const handler = {
      create: jest.fn().mockResolvedValue({
        challenge: 'challenge',
        expiresAt: new Date('2026-09-12T00:00:00.000Z'),
        type: 'authentication',
      }),
    };
    const controller = new WebauthnChallengeController(handler);
    const request: Parameters<WebauthnChallengeController['create']>[1] = {
      vaultId: 'vault-1',
      deviceId: 'device-1',
      type: 'authentication',
    };

    await expect(controller.create(user, request)).resolves.toEqual({
      challenge: 'challenge',
      expiresAt: '2026-09-12T00:00:00.000Z',
      type: 'authentication',
      userVerification: 'required',
    });
    handler.create = jest.fn().mockRejectedValue(new Error('internal detail'));
    await expect(controller.create(user, request)).rejects.toThrow(
      'Unable to create WebAuthn challenge',
    );
  });

  it('allowlists credential operations and rejects invalid credential IDs', async () => {
    const handler = {
      createRegistrationOptions: jest
        .fn()
        .mockResolvedValue({ challenge: 'challenge' }),
      verifyRegistration: jest.fn().mockResolvedValue(undefined),
      list: jest.fn().mockResolvedValue([]),
      verifyAuthentication: jest.fn().mockResolvedValue(undefined),
      revoke: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new WebauthnCredentialController(handler);
    const context = { vaultId: 'vault-1', deviceId: 'device-1' };
    const credential: Parameters<
      WebauthnCredentialController['verify']
    >[1]['credential'] = {
      id: 'credential-1',
      rawId: 'cmF3',
      type: 'public-key',
      response: { clientDataJSON: 'Y2xpZW50', attestationObject: 'YXR0' },
    };
    const assertion: Parameters<
      WebauthnCredentialController['verifyAuthentication']
    >[1]['assertion'] = {
      id: 'credential-1',
      rawId: 'cmF3',
      type: 'public-key',
      response: {
        clientDataJSON: 'Y2xpZW50',
        authenticatorData: 'YXV0aA',
        signature: 'c2ln',
      },
    };

    await expect(controller.createOptions(user, context)).resolves.toEqual({
      challenge: 'challenge',
    });
    await expect(
      controller.verify(user, {
        ...context,
        challenge: 'challenge-123456',
        credential,
      }),
    ).resolves.toEqual({ status: 'registered' });
    await expect(controller.list(user)).resolves.toEqual([]);
    await expect(
      controller.verifyAuthentication(user, {
        ...context,
        challenge: 'challenge-123456',
        assertion,
      }),
    ).resolves.toEqual({ status: 'verified' });
    await expect(controller.revoke(user, 'credential-1')).resolves.toEqual({
      status: 'revoked',
    });
    await expect(controller.revoke(user, '')).rejects.toThrow(
      'Invalid credential',
    );
    expect(handler.verifyRegistration).toHaveBeenCalledWith(
      user,
      expect.objectContaining({
        credential: expect.objectContaining({ clientExtensionResults: {} }),
      }),
    );
  });
});
