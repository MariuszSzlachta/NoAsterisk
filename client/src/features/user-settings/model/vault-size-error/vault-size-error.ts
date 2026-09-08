export class VaultSizeError extends Error {
  public constructor() {
    super('Encrypted vault payload exceeds the supported maximum size');
    this.name = 'VaultSizeError';
  }
}
