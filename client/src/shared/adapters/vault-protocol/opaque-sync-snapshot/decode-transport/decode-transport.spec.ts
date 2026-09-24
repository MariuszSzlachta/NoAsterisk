import { describe, expect, it } from 'vitest';

import { decodeOpaqueSnapshotTransport } from '#shared/adapters/vault-protocol/opaque-sync-snapshot/decode-transport';
import { encodeOpaqueSnapshotTransport } from '#shared/adapters/vault-protocol/opaque-sync-snapshot/encode-transport';

describe('decodeOpaqueSnapshotTransport', () => {
  it('round-trips UTF-8 transport data', () => {
    const value = 'synthetic snapshot ✓';
    expect(
      decodeOpaqueSnapshotTransport(encodeOpaqueSnapshotTransport(value)),
    ).toBe(value);
  });

  it('rejects malformed base64 transport data', () => {
    expect(() => decodeOpaqueSnapshotTransport('not base64')).toThrow(
      'Invalid sync snapshot',
    );
  });
});
