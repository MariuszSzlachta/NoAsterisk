export class VaultDecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VaultDecryptionError';
  }
}
