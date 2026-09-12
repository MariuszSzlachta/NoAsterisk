import { InMemoryVaultBootstrapRepository } from './in-memory-vault-bootstrap.repository';
import { InMemoryServerShareRepository } from './in-memory-server-share.repository';
import { InMemoryVaultEnrollmentRepository } from './in-memory-vault-enrollment.repository';
import { InMemoryVaultProtocolState } from './in-memory-vault-protocol-state';

it('does not infer enrollment or expose secrets for an unknown in-memory device', async () => {
  await expect(
    new InMemoryVaultBootstrapRepository().get(
      'user-1',
      'workspace-1',
      'device-1',
    ),
  ).resolves.toMatchObject({ status: 'empty', deviceId: 'device-1' });
});

it('keeps enrollment, bootstrap and ServerShare state consistent after confirmation', async () => {
  const state = new InMemoryVaultProtocolState();
  const enrollment = new InMemoryVaultEnrollmentRepository(state);
  const bootstrap = new InMemoryVaultBootstrapRepository(state);
  const shares = new InMemoryServerShareRepository(state);
  const prepared = await enrollment.prepare(
    'user-1',
    'workspace-1',
    'device-1',
  );

  await enrollment.finalize({
    challenge: prepared.challenge,
    userId: 'user-1',
    workspaceId: 'workspace-1',
    deviceId: 'device-1',
    vaultId: 'vault-1',
    keyId: 'key-1',
    deviceEnvelope: 'opaque-envelope',
    signingPublicKey: '{"kty":"EC"}',
  });
  await expect(
    bootstrap.get('user-1', 'workspace-1', 'device-1'),
  ).resolves.toMatchObject({ status: 'enrollment-required' });

  await enrollment.confirm({
    challenge: prepared.challenge,
    userId: 'user-1',
    workspaceId: 'workspace-1',
    deviceId: 'device-1',
    vaultId: 'vault-1',
    keyId: 'key-1',
  });

  await expect(
    bootstrap.get('user-1', 'workspace-1', 'device-1'),
  ).resolves.toMatchObject({
    status: 'available',
    vaultId: 'vault-1',
    keyId: 'key-1',
    deviceEnvelope: 'opaque-envelope',
  });
  await expect(
    shares.issue('user-1', 'workspace-1', 'device-1'),
  ).resolves.toEqual(prepared.serverShare);
});
