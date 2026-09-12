import { GetVaultBootstrapHandler } from './get-vault-bootstrap.handler';
import { InMemoryVaultBootstrapRepository } from '@vault-protocol/infrastructure/in-memory-vault-bootstrap.repository';

describe('GetVaultBootstrapHandler', () => {
  it('returns an empty protocol state without creating a vault or key material', async () => {
    const handler = new GetVaultBootstrapHandler(
      new InMemoryVaultBootstrapRepository(),
    );
    await expect(
      handler.execute('user-1', 'workspace-1', 'device-1'),
    ).resolves.toEqual({
      status: 'empty',
      deviceId: 'device-1',
      protocolVersion: 2,
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
    });
  });

  it('rejects an empty device identifier', () => {
    const handler = new GetVaultBootstrapHandler(
      new InMemoryVaultBootstrapRepository(),
    );
    expect(() => handler.execute('user-1', 'workspace-1', '')).toThrow(
      'Device ID cannot be empty',
    );
  });
});
