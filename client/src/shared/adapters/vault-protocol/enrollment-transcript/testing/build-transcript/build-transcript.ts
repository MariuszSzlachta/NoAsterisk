import type { EnrollmentTranscriptSnapshot } from '#shared/adapters/vault-protocol/enrollment-transcript';

export const buildEnrollmentTranscript = (): Extract<
  EnrollmentTranscriptSnapshot,
  { purpose: 'initial' | 'recovery' }
> => ({
  purpose: 'recovery',
  accountId: 'account',
  workspaceId: 'workspace',
  vaultId: 'vault',
  keyId: 'key',
  deviceId: 'device',
  challenge: 'A'.repeat(43),
  createdAt: 1_000,
  expiresAt: 61_000,
  signingPublicKey: '{"public":"signing"}',
  recoveryPublicKey: 'a'.repeat(64),
  deviceEnvelope: '{"ciphertext":"device"}',
});
