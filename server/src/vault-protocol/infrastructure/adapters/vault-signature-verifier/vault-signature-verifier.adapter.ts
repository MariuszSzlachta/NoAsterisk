import { Injectable } from '@nestjs/common';
import { ed25519 } from '@noble/curves/ed25519.js';
import { createPublicKey, verify } from 'node:crypto';
import type { VaultSignatureVerifierPort } from '@vault-protocol/domain/ports/vault-signature-verifier';
import { recoveryRegistrationFormat } from '@vault-protocol/domain/recovery-registration/constants';
import { recoveryPublicKeyPattern } from '@vault-protocol/domain/recovery-registration/patterns/recovery-public-key.pattern';
import { recoverySignaturePattern } from '@vault-protocol/domain/recovery-registration/patterns/recovery-signature.pattern';
import { publicDeviceKeySchema } from '@vault-protocol/infrastructure/adapters/public-device-key-schema';

@Injectable()
export class VaultSignatureVerifierAdapter implements VaultSignatureVerifierPort {
  async verifyDevice(
    publicKey: string,
    message: Uint8Array,
    signature: string,
  ): Promise<boolean> {
    if (
      publicKey.length > recoveryRegistrationFormat.maxSigningPublicKeyLength ||
      message.length > recoveryRegistrationFormat.maxMessageBytes ||
      signature.length !== recoveryRegistrationFormat.signatureLength ||
      !recoverySignaturePattern.test(signature)
    )
      return false;
    try {
      const parsed: unknown = JSON.parse(publicKey);
      const key = createPublicKey({
        key: publicDeviceKeySchema.parse(parsed),
        format: 'jwk',
      });
      return verify(
        'sha256',
        message,
        { key, dsaEncoding: 'ieee-p1363' },
        Buffer.from(signature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  async verifyRecovery(
    publicKey: string,
    message: Uint8Array,
    signature: string,
  ): Promise<boolean> {
    if (
      publicKey.length !== recoveryRegistrationFormat.publicKeyLength ||
      signature.length !== recoveryRegistrationFormat.signatureLength ||
      !recoveryPublicKeyPattern.test(publicKey) ||
      !recoverySignaturePattern.test(signature) ||
      message.length > recoveryRegistrationFormat.maxMessageBytes
    )
      return false;
    try {
      // Native OpenSSL accepts some small-order forgeries; use the browser's
      // strict RFC-8032 verifier on both sides rather than a custom point blacklist.
      return ed25519.verify(
        Buffer.from(signature, 'hex'),
        message,
        Buffer.from(publicKey, 'hex'),
        { zip215: false },
      );
    } catch {
      return false;
    }
  }
}
