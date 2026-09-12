import type { EnrollmentTranscriptSnapshot } from '#shared/adapters/vault-protocol/enrollment-transcript';

export const buildTrustedEnrollmentTranscript = (): Extract<
  EnrollmentTranscriptSnapshot,
  { purpose: 'trusted' }
> => ({
  purpose: 'trusted',
  accountId: 'account',
  workspaceId: 'workspace',
  vaultId: 'vault',
  keyId: 'key',
  deviceId: 'device',
  challenge: 'A'.repeat(43),
  createdAt: 1_000,
  expiresAt: 61_000,
  signingPublicKey: '{"public":"signing"}',
  oldDeviceId: 'approver',
  newEphemeralPublicKey: '{"public":"ephemeral"}',
  delegationDigest: 'b'.repeat(64),
  deviceEnvelope: '{"ciphertext":"device"}',
});
