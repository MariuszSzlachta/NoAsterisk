export const dualRootRotationDtoLimits = {
  identifier: 128,
  challenge: 43,
  signature: 128,
  messageBytes: 65_536,
  domain: 'budgetflow/vault-rotation/v2',
  version: 2,
  cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
  publicKey: 64,
  signingPublicKey: 10_000,
  envelope: 128 * 1024,
};
