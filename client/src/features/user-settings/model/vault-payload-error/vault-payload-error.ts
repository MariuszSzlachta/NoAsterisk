export class VaultPayloadError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'VaultPayloadError';
  }
}
