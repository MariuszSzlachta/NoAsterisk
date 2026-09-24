import { describe, expect, it } from 'vitest';

import type { RotationTranscriptSnapshot } from '#shared/adapters/vault-protocol/rotation-transcript';
import { encodeRotationTranscript } from '#shared/adapters/vault-protocol/rotation-transcript/encode';

const snapshot: RotationTranscriptSnapshot = {
  accountId: 'account-1',
  workspaceId: 'workspace-1',
  vaultId: 'vault-1',
  deviceId: 'device-1',
  currentKeyId: 'key-1',
  nextKeyId: 'key-2',
  challenge: 'a'.repeat(43),
  expiresAt: '2026-09-13T09:00:00.000Z',
  currentRecoveryPublicKey: 'a'.repeat(64),
  nextRecoveryPublicKey: 'b'.repeat(64),
  signingPublicKey: '{"kty":"EC"}',
  envelopePurpose: 'device-wrap',
  envelope: 'opaque-envelope',
};

describe('encodeRotationTranscript', () => {
  it('matches the canonical backend field order', () => {
    expect(
      JSON.parse(new TextDecoder().decode(encodeRotationTranscript(snapshot))),
    ).toEqual([
      'budgetflow/vault-rotation/v2',
      2,
      'HKDF-SHA256/AES-256-GCM',
      'account-1',
      'workspace-1',
      'vault-1',
      'device-1',
      'key-1',
      'key-2',
      'a'.repeat(43),
      '2026-09-13T09:00:00.000Z',
      'a'.repeat(64),
      'b'.repeat(64),
      '{"kty":"EC"}',
      'device-wrap',
      'opaque-envelope',
      null,
    ]);
  });

  it('rejects an invalid authority or envelope combination', () => {
    expect(() =>
      encodeRotationTranscript({
        ...snapshot,
        nextRecoveryPublicKey: snapshot.currentRecoveryPublicKey,
      }),
    ).toThrow('Invalid vault rotation transcript');
    expect(() =>
      encodeRotationTranscript({
        ...snapshot,
        envelopePurpose: 'passkey-wrap',
        passkeyEnvelope: 'secondary',
      }),
    ).toThrow('Invalid vault rotation transcript');
  });
});
