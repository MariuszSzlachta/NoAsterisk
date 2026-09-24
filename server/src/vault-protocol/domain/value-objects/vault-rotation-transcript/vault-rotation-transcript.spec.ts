import { DomainError } from '@budget/domain';
import { VaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';
import type { VaultRotationTranscriptSnapshot } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';

const snapshot: VaultRotationTranscriptSnapshot = {
  accountId: 'account-1',
  workspaceId: 'workspace-1',
  vaultId: 'vault-1',
  deviceId: 'device-1',
  currentKeyId: 'key-1',
  nextKeyId: 'key-2',
  challenge: 'a'.repeat(43),
  expiresAt: Date.now() + 60_000,
  currentRecoveryPublicKey: 'a'.repeat(64),
  nextRecoveryPublicKey: 'b'.repeat(64),
  signingPublicKey: JSON.stringify({ kty: 'EC', crv: 'P-256', x: 'x', y: 'y' }),
  envelopePurpose: 'device-wrap',
  envelope: 'opaque-device-envelope',
};

const invalidSnapshots: readonly VaultRotationTranscriptSnapshot[] = [
  { ...snapshot, currentKeyId: snapshot.nextKeyId },
  { ...snapshot, nextRecoveryPublicKey: snapshot.currentRecoveryPublicKey },
  { ...snapshot, challenge: '!'.repeat(43) },
  { ...snapshot, envelope: '' },
  {
    ...snapshot,
    envelopePurpose: 'passkey-wrap',
    passkeyEnvelope: 'secondary',
  },
];

describe('VaultRotationTranscript', () => {
  it('encodes the complete ordered rotation transcript', () => {
    const transcript = new VaultRotationTranscript(snapshot);
    const encoded = new TextDecoder().decode(transcript.toSigningBytes());

    expect(JSON.parse(encoded)).toEqual([
      'budgetflow/vault-rotation/v2',
      2,
      'HKDF-SHA256/AES-256-GCM',
      'account-1',
      'workspace-1',
      'vault-1',
      'device-1',
      'key-1',
      'key-2',
      snapshot.challenge,
      new Date(snapshot.expiresAt).toISOString(),
      'a'.repeat(64),
      'b'.repeat(64),
      snapshot.signingPublicKey,
      'device-wrap',
      'opaque-device-envelope',
      null,
    ]);
  });

  it.each(invalidSnapshots)(
    'rejects an invalid or ambiguous snapshot',
    (invalid) => {
      expect(() => new VaultRotationTranscript(invalid)).toThrow(DomainError);
    },
  );

  it('rejects a transcript that exceeds the canonical message limit', () => {
    expect(() =>
      new VaultRotationTranscript({
        ...snapshot,
        envelope: 'x'.repeat(128 * 1024),
      }).toSigningBytes(),
    ).toThrow('exceeds limit');
  });
});
