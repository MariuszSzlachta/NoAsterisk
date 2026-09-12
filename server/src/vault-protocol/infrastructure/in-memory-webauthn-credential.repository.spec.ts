import { InMemoryWebauthnCredentialRepository } from './in-memory-webauthn-credential.repository';

const createCredential = () => ({
  userId: 'user-1',
  credentialId: 'credential-1',
  publicKey: new Uint8Array([1, 2, 3]),
  counter: 0,
  transports: ['internal'],
  supportsPrf: true,
});

describe('InMemoryWebauthnCredentialRepository', () => {
  it('creates immutable copies and returns only active credentials', async () => {
    const repository = new InMemoryWebauthnCredentialRepository();
    const credential = createCredential();
    await repository.create(credential);

    credential.publicKey[0] = 99;
    credential.transports.push('usb');

    const stored = await repository.findActiveByCredentialId('credential-1');
    expect(stored).toMatchObject({
      userId: 'user-1',
      credentialId: 'credential-1',
      counter: 0,
      supportsPrf: true,
      transports: ['internal'],
    });
    expect(stored?.publicKey).toEqual(new Uint8Array([1, 2, 3]));
    await expect(repository.listActiveByUserId('user-1')).resolves.toHaveLength(
      1,
    );
    await expect(repository.listActiveByUserId('other-user')).resolves.toEqual(
      [],
    );
  });

  it('rejects duplicate credential IDs and updates counters', async () => {
    const repository = new InMemoryWebauthnCredentialRepository();
    const credential = createCredential();
    await repository.create(credential);

    await expect(repository.create(credential)).rejects.toThrow(
      'WebAuthn credential already exists',
    );
    await expect(
      repository.updateCounter('credential-1', 7),
    ).resolves.toBeUndefined();
    await expect(
      repository.findActiveByCredentialId('credential-1'),
    ).resolves.toMatchObject({
      counter: 7,
    });
    await expect(repository.updateCounter('missing', 1)).rejects.toThrow(
      'WebAuthn credential not found',
    );
  });

  it('revokes only credentials belonging to the requested user', async () => {
    const repository = new InMemoryWebauthnCredentialRepository();
    const credential = createCredential();
    await repository.create(credential);

    await repository.revoke('other-user', 'credential-1');
    await expect(
      repository.findActiveByCredentialId('credential-1'),
    ).resolves.toBeDefined();

    await repository.revoke('user-1', 'credential-1');
    await expect(
      repository.findActiveByCredentialId('credential-1'),
    ).resolves.toBeUndefined();
    await expect(repository.listActiveByUserId('user-1')).resolves.toEqual([]);
    await expect(repository.updateCounter('credential-1', 8)).rejects.toThrow(
      'WebAuthn credential not found',
    );
  });
});
