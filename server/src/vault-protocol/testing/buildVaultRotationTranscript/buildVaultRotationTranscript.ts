import { VaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';
import type { VaultRotationTranscriptSnapshot } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';
export const buildVaultRotationTranscript = (
  overrides: Partial<VaultRotationTranscriptSnapshot> = {},
): VaultRotationTranscript =>
  new VaultRotationTranscript({
    accountId: '00000000-0000-4000-8000-000000000001',
    workspaceId: '00000000-0000-4000-8000-000000000002',
    vaultId: '00000000-0000-4000-8000-000000000003',
    deviceId: 'synthetic-device',
    currentKeyId: 'current-key',
    nextKeyId: 'next-key',
    challenge: 'A'.repeat(43),
    expiresAt: Date.now() + 30_000,
    currentRecoveryPublicKey: 'a'.repeat(64),
    nextRecoveryPublicKey: 'b'.repeat(64),
    signingPublicKey: '{"kty":"EC"}',
    envelopePurpose: 'device-wrap',
    envelope: 'opaque-envelope',
    ...overrides,
  });
