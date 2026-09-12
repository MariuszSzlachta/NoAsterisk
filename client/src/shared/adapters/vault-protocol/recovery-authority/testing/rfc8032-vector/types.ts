export interface RecoverySignatureVector {
  readonly seed: Uint8Array;
  readonly publicKey: Uint8Array;
  readonly message: Uint8Array;
  readonly signature: Uint8Array;
}
