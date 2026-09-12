import type { EnrollmentTranscriptSnapshot } from '@vault-protocol/domain/value-objects/enrollment-transcript';

export const buildEnrollmentTranscript = (): Extract<
  EnrollmentTranscriptSnapshot,
  { readonly purpose: 'initial' | 'recovery' }
> => ({
  purpose: 'recovery',
  accountId: 'account',
  workspaceId: 'workspace',
  vaultId: 'vault',
  keyId: 'key',
  deviceId: 'device',
  challenge: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  createdAt: 1_000,
  expiresAt: 61_000,
  signingPublicKey: '{"public":"signing"}',
  recoveryPublicKey: 'a'.repeat(64),
  deviceEnvelope: '{"ciphertext":"device"}',
});
