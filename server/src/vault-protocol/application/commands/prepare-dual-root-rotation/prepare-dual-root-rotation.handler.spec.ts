import { DomainError } from '@budget/domain';
import { UnauthorizedException } from '@nestjs/common';
import { PrepareDualRootRotationHandler } from '@vault-protocol/application/commands/prepare-dual-root-rotation';
import type { PrepareDualRootRotationCommand } from '@vault-protocol/application/commands/prepare-dual-root-rotation/types';
import type { DualRootRotationRepository } from '@vault-protocol/domain/ports/dual-root-rotation';
import { VaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';
import { buildRecoveryRegistrationCommand } from '@vault-protocol/testing/build-recovery-registration-command';

const transcript = new VaultRotationTranscript({
  accountId: 'user-1',
  workspaceId: 'workspace-1',
  vaultId: 'vault-1',
  deviceId: 'device-1',
  currentKeyId: 'key-1',
  nextKeyId: 'key-2',
  challenge: 'a'.repeat(43),
  expiresAt: Date.now() + 60_000,
  currentRecoveryPublicKey: 'a'.repeat(64),
  nextRecoveryPublicKey: 'b'.repeat(64),
  signingPublicKey: '{"kty":"EC"}',
  envelopePurpose: 'device-wrap',
  envelope: 'opaque-envelope',
});

describe('PrepareDualRootRotationHandler', () => {
  it('derives account and workspace from authenticated user', async () => {
    const repository: jest.Mocked<DualRootRotationRepository> = {
      prepare: jest.fn().mockResolvedValue(transcript),
      finalize: jest.fn(),
    };
    const user = buildRecoveryRegistrationCommand().user;
    const command: PrepareDualRootRotationCommand = {
      user,
      vaultId: 'vault-1',
      deviceId: 'device-1',
      currentKeyId: 'key-1',
      nextKeyId: 'key-2',
      nextRecoveryPublicKey: 'b'.repeat(64),
      signingPublicKey: '{"kty":"EC"}',
      envelopePurpose: 'device-wrap',
      envelope: 'opaque-envelope',
    };

    await expect(
      new PrepareDualRootRotationHandler(repository).execute(command),
    ).resolves.toBe(transcript);
    expect(repository.prepare).toHaveBeenCalledWith(
      {
        userId: user.userId,
        workspaceId: user.workspaceId,
        vaultId: command.vaultId,
        deviceId: command.deviceId,
        currentKeyId: command.currentKeyId,
        nextKeyId: command.nextKeyId,
        nextRecoveryPublicKey: command.nextRecoveryPublicKey,
        signingPublicKey: command.signingPublicKey,
        envelopePurpose: command.envelopePurpose,
        envelope: command.envelope,
      },
      expect.any(Number),
    );
  });

  it('rejects stale interactive authentication before repository access', async () => {
    const repository: jest.Mocked<DualRootRotationRepository> = {
      prepare: jest.fn().mockResolvedValue(transcript),
      finalize: jest.fn(),
    };
    const user = buildRecoveryRegistrationCommand().user;

    await expect(
      new PrepareDualRootRotationHandler(repository).execute({
        user: { ...user, authTime: Date.now() - 360_000 },
        vaultId: 'vault-1',
        deviceId: 'device-1',
        currentKeyId: 'key-1',
        nextKeyId: 'key-2',
        nextRecoveryPublicKey: 'b'.repeat(64),
        signingPublicKey: '{"kty":"EC"}',
        envelopePurpose: 'device-wrap',
        envelope: 'opaque-envelope',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.prepare).not.toHaveBeenCalled();
  });

  it('propagates fail-closed repository responses', async () => {
    const repository: jest.Mocked<DualRootRotationRepository> = {
      prepare: jest
        .fn()
        .mockRejectedValue(
          new DomainError('Dual-root vault rotation is unavailable'),
        ),
      finalize: jest.fn(),
    };
    const user = buildRecoveryRegistrationCommand().user;

    await expect(
      new PrepareDualRootRotationHandler(repository).execute({
        user,
        vaultId: 'vault-1',
        deviceId: 'device-1',
        currentKeyId: 'key-1',
        nextKeyId: 'key-2',
        nextRecoveryPublicKey: 'b'.repeat(64),
        signingPublicKey: '{"kty":"EC"}',
        envelopePurpose: 'device-wrap',
        envelope: 'opaque-envelope',
      }),
    ).rejects.toThrow('Dual-root vault rotation is unavailable');
  });
});
