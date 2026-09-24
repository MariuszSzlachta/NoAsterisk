export const vaultRotationTranscriptFormat = Object.freeze({
  ttlMs: 60_000,
  domain: 'budgetflow/vault-rotation/v2',
  version: 2,
  cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
  maxIdentifierLength: 128,
  maxPublicKeyLength: 10_000,
  maxEnvelopeLength: 128 * 1024,
  maxMessageBytes: 65_536,
  maxChallengeLength: 43,
  publicKeyLength: 64,
});
