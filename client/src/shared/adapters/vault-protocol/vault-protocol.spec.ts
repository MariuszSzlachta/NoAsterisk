import { describe, expect, it } from 'vitest';

import { vaultProtocol } from '#shared/adapters/vault-protocol';

const buildContext = (
  overrides: Partial<Parameters<typeof vaultProtocol.deriveKeys>[1]> = {},
): Parameters<typeof vaultProtocol.deriveKeys>[1] => ({
  accountId: 'account-1',
  workspaceId: 'workspace-1',
  vaultId: 'vault-1',
  keyId: 'key-1',
  ...overrides,
});

const buildRecordContext = (
  overrides: Partial<Parameters<typeof vaultProtocol.encryptRecord>[1]> = {},
): Parameters<typeof vaultProtocol.encryptRecord>[1] => ({
  ...buildContext(),
  collection: 'transactions',
  recordId: 'record-1',
  ...overrides,
});

const buildHeader = (
  overrides: Partial<Parameters<typeof vaultProtocol.createSnapshot>[1]> = {},
): Parameters<typeof vaultProtocol.createSnapshot>[1] => ({
  ...buildContext(),
  formatVersion: 2,
  cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
  revision: 1,
  previousEnvelopeHash: '',
  createdByDeviceId: 'device-1',
  createdAt: '2026-09-11T00:00:00.000Z',
  nonce: '',
  ...overrides,
});

const createSigningKeys = async (): Promise<CryptoKeyPair> =>
  crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, [
    'sign',
    'verify',
  ]);

const fromHex = (value: string): Uint8Array => {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
};

const deriveVector = async (
  input: Uint8Array,
  salt: Uint8Array,
  info: string,
): Promise<string> => {
  const key = await crypto.subtle.importKey('raw', input, 'HKDF', false, [
    'deriveBits',
  ]);
  const output = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt,
        info: new TextEncoder().encode(info),
      },
      key,
      256,
    ),
  );
  return [...output].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

describe('vault protocol v2', () => {
  it('matches the versioned hierarchy test vectors', async () => {
    const vmk = fromHex(
      '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    );
    const salt = new TextEncoder().encode('vault-1');

    await expect(
      deriveVector(vmk, salt, 'budgetflow/local-records/v2'),
    ).resolves.toBe(
      '982e89e6edf01ff66cfa433527e58c84bdd01ec76a31d620a274b1f2b974624b',
    );
    await expect(
      deriveVector(vmk, salt, 'budgetflow/sync-snapshot/v2'),
    ).resolves.toBe(
      '908f3a12c51edd88030a21aef37705b895773b20110fbbfec87836f027739dbe',
    );
    await expect(
      deriveVector(vmk, salt, 'budgetflow/key-check/v2'),
    ).resolves.toBe(
      '2f317e38796fdda9e8116956f772ce9032ed2aae3c2ddd6faf70c745a539f779',
    );
  });

  it('matches the versioned split-wrap HKDF vector', async () => {
    const localShare = fromHex(
      '101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f',
    );
    const serverShare = fromHex(
      '202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f',
    );
    const info = vaultProtocol.canonicalize({
      domain: 'budgetflow/device-wrap/v1',
      accountId: 'account-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
    });

    await expect(deriveVector(localShare, serverShare, info)).resolves.toBe(
      '5ff99ae4a4e261a650fd965a2c5fa3b751ab5a484c7eb1299d54aa0e4f6db371',
    );
  });

  it('derives distinct non-extractable purpose keys from a random VMK', async () => {
    const vmk = vaultProtocol.generateVmk();
    const keys = await vaultProtocol.deriveKeys(vmk, buildContext());

    expect(vmk).toHaveLength(32);
    expect(keys.local.extractable).toBe(false);
    expect(keys.sync.extractable).toBe(false);
    expect(keys.check.extractable).toBe(false);
    expect(keys.local).not.toBe(keys.sync);
  });

  it('roundtrips records and binds ciphertext to the complete record context', async () => {
    const context = buildContext();
    const { local } = await vaultProtocol.deriveKeys(
      vaultProtocol.generateVmk(),
      context,
    );
    const record = buildRecordContext();
    const envelope = await vaultProtocol.encryptRecord(
      JSON.stringify({ title: 'Żabka 🧾', amount: -12.5 }),
      record,
      local,
    );

    await expect(
      vaultProtocol.decryptRecord(envelope, record, local),
    ).resolves.toContain('Żabka');
    await expect(
      vaultProtocol.decryptRecord(
        envelope,
        { ...record, recordId: 'other' },
        local,
      ),
    ).rejects.toThrow();
    await expect(
      vaultProtocol.decryptRecord(
        envelope,
        { ...record, vaultId: 'other-vault' },
        local,
      ),
    ).rejects.toThrow();
  });

  it('rejects tampering, downgrade and malformed ciphertext before plaintext use', async () => {
    const context = buildContext();
    const { local } = await vaultProtocol.deriveKeys(
      vaultProtocol.generateVmk(),
      context,
    );
    const record = buildRecordContext();
    const envelope = await vaultProtocol.encryptRecord('secret', record, local);

    await expect(
      vaultProtocol.decryptRecord(
        { ...envelope, ciphertext: envelope.ciphertext.slice(0, -2) + 'AA==' },
        record,
        local,
      ),
    ).rejects.toThrow();
    await expect(
      vaultProtocol.decryptRecord(
        { ...envelope, header: { ...envelope.header, formatVersion: 1 } },
        record,
        local,
      ),
    ).rejects.toThrow();
    await expect(
      vaultProtocol.decryptRecord(
        { ...envelope, header: { ...envelope.header, nonce: 'AA==' } },
        record,
        local,
      ),
    ).rejects.toThrow();
    await expect(
      vaultProtocol.decryptRecord(
        {
          ...envelope,
          header: { ...envelope.header, unexpected: 'extension' },
        },
        record,
        local,
      ),
    ).rejects.toThrow();
  });

  it('canonicalizes object property order and uses distinct purpose derivations', () => {
    expect(vaultProtocol.canonicalize({ b: 2, a: { d: 4, c: 3 } })).toBe(
      vaultProtocol.canonicalize({ a: { c: 3, d: 4 }, b: 2 }),
    );
    expect(vaultProtocol.canonicalize({ a: 1, b: 2 })).not.toBe(
      vaultProtocol.canonicalize({ a: 1, b: 3 }),
    );
  });

  it('creates and verifies an authenticated key sentinel', async () => {
    const context = buildContext();
    const { check } = await vaultProtocol.deriveKeys(
      vaultProtocol.generateVmk(),
      context,
    );
    const sentinel = await vaultProtocol.createSentinel(context, check);

    await expect(
      vaultProtocol.verifySentinel(sentinel, context, check),
    ).resolves.toBeUndefined();
    await expect(
      vaultProtocol.verifySentinel(
        sentinel,
        { ...context, accountId: 'other' },
        check,
      ),
    ).rejects.toThrow();
  });

  it('signs snapshots, verifies them before decryption, and detects chain rollback', async () => {
    const context = buildContext();
    const keys = await vaultProtocol.deriveKeys(
      vaultProtocol.generateVmk(),
      context,
    );
    const signingKeys = await createSigningKeys();
    const firstHeader = buildHeader();
    const first = await vaultProtocol.createSnapshot(
      '{"transactions":[]}',
      firstHeader,
      keys.sync,
      signingKeys.privateKey,
    );
    const firstHash = await vaultProtocol.hashEnvelope(first);
    const second = await vaultProtocol.createSnapshot(
      '{"transactions":[1]}',
      buildHeader({ revision: 2, previousEnvelopeHash: firstHash }),
      keys.sync,
      signingKeys.privateKey,
    );
    const secondHash = await vaultProtocol.hashEnvelope(second);

    await expect(
      vaultProtocol.decryptSnapshot(
        second,
        context,
        keys.sync,
        signingKeys.publicKey,
      ),
    ).resolves.toContain('transactions');
    await expect(
      vaultProtocol.decryptSnapshot(
        { ...second, signature: first.signature },
        context,
        keys.sync,
        signingKeys.publicKey,
      ),
    ).rejects.toThrow();
    await expect(
      vaultProtocol.assertFreshSnapshot(first, 2, firstHash),
    ).rejects.toThrow('rollback');
    await expect(
      vaultProtocol.assertFreshSnapshot(second, 1, 'wrong-hash'),
    ).rejects.toThrow('chain');
    await expect(
      vaultProtocol.assertFreshSnapshot(second, 2, secondHash),
    ).resolves.toBeUndefined();
  });

  it('creates a non-extractable LocalShare and roundtrips a VMK with split unlock', async () => {
    const localShare = await vaultProtocol.generateLocalShare();
    const serverShare = new Uint8Array(32).fill(7);
    const context = { ...buildContext(), deviceId: 'device-1' };
    const wrappingKey = await vaultProtocol.deriveDeviceKey(
      localShare,
      serverShare,
      context,
    );
    const vmk = vaultProtocol.generateVmk();
    const envelope = await vaultProtocol.wrapVmk(
      vmk,
      wrappingKey,
      context,
      'device-wrap',
    );

    expect(localShare.extractable).toBe(false);
    expect(localShare.usages).toEqual(['deriveKey']);
    expect(envelope.ciphertext).not.toBe('');
    await expect(
      vaultProtocol.unwrapVmk(envelope, wrappingKey, context, 'device-wrap'),
    ).resolves.toEqual(vmk);
    await expect(
      vaultProtocol.unwrapVmk(
        envelope,
        wrappingKey,
        { ...context, deviceId: 'other-device' },
        'device-wrap',
      ),
    ).rejects.toThrow();
    await expect(
      vaultProtocol.unwrapVmk(envelope, wrappingKey, context, 'passkey-wrap'),
    ).rejects.toThrow();
  });

  it('derives a distinct PRF wrapping key and never accepts a device envelope as PRF', async () => {
    const localShare = await vaultProtocol.generateLocalShare();
    const prfKey = await vaultProtocol.importPrfOutput(
      new Uint8Array(32).fill(8),
    );
    const serverShare = new Uint8Array(32).fill(9);
    const context = {
      ...buildContext(),
      deviceId: 'device-1',
      credentialId: 'credential-1',
    };
    const deviceKey = await vaultProtocol.deriveDeviceKey(
      localShare,
      serverShare,
      context,
    );
    const prfWrapKey = await vaultProtocol.derivePrfKey(
      prfKey,
      serverShare,
      context,
    );
    expect(prfWrapKey).not.toBe(deviceKey);
    const envelope = await vaultProtocol.wrapVmk(
      vaultProtocol.generateVmk(),
      deviceKey,
      context,
      'device-wrap',
    );
    await expect(
      vaultProtocol.unwrapVmk(envelope, prfWrapKey, context, 'passkey-wrap'),
    ).rejects.toThrow();
  });

  it.each([
    ['short VMK', new Uint8Array(31)],
    ['short PRF output', new Uint8Array(31)],
  ])('rejects %s', async (name, bytes) => {
    const action =
      name === 'short VMK'
        ? vaultProtocol.deriveKeys(bytes, buildContext())
        : vaultProtocol.importPrfOutput(bytes);
    await expect(action).rejects.toThrow();
  });
});
