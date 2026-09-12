import { ForbiddenException } from '@nestjs/common';
import { EnableHighSecurityHandler } from '@vault-protocol/application/enable-high-security.handler';
import type { VaultSecurityRepository } from '@vault-protocol/domain/ports/vault-security.repository';

const user = {
  userId: 'user-1',
  workspaceId: 'workspace-1',
  role: 'Member',
  authTime: Date.now(),
  amr: 'webauthn' as const,
};

describe('EnableHighSecurityHandler', () => {
  it('requires recent interactive authentication and recovery confirmation', async () => {
    const repository: VaultSecurityRepository = {
      enablePasskeyUnlock: jest.fn(),
      enableHighSecurity: jest.fn(),
      disableHighSecurity: jest.fn(),
    };
    const handler = new EnableHighSecurityHandler(repository);

    await expect(
      handler.execute({
        user,
        vaultId: 'vault-1',
        keyId: 'key-1',
        deviceId: 'device-1',
        passkeyEnvelope: 'opaque-envelope',
        recoveryConfirmed: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.enableHighSecurity).not.toHaveBeenCalled();
  });

  it('forwards only opaque envelope material after the policy checks', async () => {
    const repository: VaultSecurityRepository = {
      enablePasskeyUnlock: jest.fn(),
      enableHighSecurity: jest.fn(),
      disableHighSecurity: jest.fn(),
    };
    const handler = new EnableHighSecurityHandler(repository);

    await handler.execute({
      user,
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: 'opaque-envelope',
      recoveryConfirmed: true,
    });

    expect(repository.enableHighSecurity).toHaveBeenCalledWith({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: 'opaque-envelope',
    });
  });

  it('stores a PRF envelope without removing the standard split envelope', async () => {
    const repository: VaultSecurityRepository = {
      enablePasskeyUnlock: jest.fn(),
      enableHighSecurity: jest.fn(),
      disableHighSecurity: jest.fn(),
    };
    const handler = new EnableHighSecurityHandler(repository);

    await handler.enablePasskeyUnlock({
      user,
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: 'opaque-envelope',
      recoveryConfirmed: true,
    });

    expect(repository.enablePasskeyUnlock).toHaveBeenCalledWith({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: 'opaque-envelope',
    });
  });

  it('fails closed for empty envelopes and unconfirmed recovery on every transition', async () => {
    const repository: VaultSecurityRepository = {
      enablePasskeyUnlock: jest.fn(),
      enableHighSecurity: jest.fn(),
      disableHighSecurity: jest.fn(),
    };
    const handler = new EnableHighSecurityHandler(repository);
    const base = {
      user,
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
    };

    await expect(
      handler.execute({
        ...base,
        passkeyEnvelope: '',
        recoveryConfirmed: true,
      }),
    ).rejects.toThrow('Passkey envelope is required');
    await expect(
      handler.enablePasskeyUnlock({
        ...base,
        passkeyEnvelope: '',
        recoveryConfirmed: true,
      }),
    ).rejects.toThrow('Passkey envelope is required');
    await expect(
      handler.disable({
        ...base,
        passkeyEnvelope: '',
        recoveryConfirmed: true,
      }),
    ).rejects.toThrow('Device envelope is required');
    await expect(
      handler.disable({
        ...base,
        passkeyEnvelope: 'device-envelope',
        recoveryConfirmed: false,
      }),
    ).rejects.toThrow('Recovery confirmation required');
    expect(repository.disableHighSecurity).not.toHaveBeenCalled();
  });

  it('forwards the disable transition with the device envelope', async () => {
    const repository: VaultSecurityRepository = {
      enablePasskeyUnlock: jest.fn(),
      enableHighSecurity: jest.fn(),
      disableHighSecurity: jest.fn(),
    };
    const handler = new EnableHighSecurityHandler(repository);

    await handler.disable({
      user,
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: 'device-envelope',
      recoveryConfirmed: true,
    });

    expect(repository.disableHighSecurity).toHaveBeenCalledWith({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: 'device-envelope',
    });
  });
});
