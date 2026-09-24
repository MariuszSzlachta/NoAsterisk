export const rotationTranscriptFormat = Object.freeze({
  domain: 'budgetflow/vault-rotation/v2',
  version: 2,
  cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
  maxIdentifierLength: 128,
  maxPublicKeyLength: 10_000,
  maxEnvelopeLength: 128 * 1024,
  maxMessageBytes: 65_536,
  challengeLength: 43,
  recoveryPublicKeyLength: 64,
});
