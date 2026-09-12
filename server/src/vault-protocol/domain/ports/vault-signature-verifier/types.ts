export interface VaultSignatureVerifierPort {
  verifyDevice(
    publicKey: string,
    message: Uint8Array,
    signature: string,
  ): Promise<boolean>;
  verifyRecovery(
    publicKey: string,
    message: Uint8Array,
    signature: string,
  ): Promise<boolean>;
}
