import type { KeyObject } from 'node:crypto';

export interface VaultSignatureFixture {
  readonly devicePrivateKey: KeyObject;
  readonly devicePublicKey: string;
  readonly recoverySeed: Uint8Array;
  readonly recoveryPublicKey: string;
  readonly message: Uint8Array;
  readonly deviceSignature: string;
  readonly recoverySignature: string;
}
