import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

interface EncryptedServerShare {
  readonly ciphertext: string;
  readonly nonce: string;
  readonly authTag: string;
  readonly infrastructureKeyVersion: number;
}

const KEY_LENGTH = 32;
const NONCE_LENGTH = 12;
const SERVER_SHARE_LENGTH = 32;
const INFRASTRUCTURE_KEY_VERSION = 1;
const BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

const decodeBase64Field = (
  value: string,
  expectedLength: number,
  label: string,
): Buffer => {
  if (
    value.length > 4 * Math.ceil(expectedLength / 3) ||
    !BASE64_PATTERN.test(value)
  ) {
    throw new Error(`Invalid ${label}`);
  }
  const decoded = Buffer.from(value, 'base64');
  if (decoded.length !== expectedLength) throw new Error(`Invalid ${label}`);
  return decoded;
};

const decodeInfrastructureKey = (): Buffer => {
  const encoded = process.env['VAULT_INFRASTRUCTURE_KEY_BASE64'];
  if (encoded === undefined) {
    throw new Error('VAULT_INFRASTRUCTURE_KEY_BASE64 is required');
  }
  return decodeBase64Field(
    encoded,
    KEY_LENGTH,
    'VAULT_INFRASTRUCTURE_KEY_BASE64',
  );
};

export class ServerShareEncryptionAdapter {
  encrypt(serverShare: Uint8Array): EncryptedServerShare {
    if (serverShare.length !== SERVER_SHARE_LENGTH) {
      throw new Error('ServerShare must contain 32 bytes');
    }
    const nonce = randomBytes(NONCE_LENGTH);
    const cipher = createCipheriv(
      'aes-256-gcm',
      decodeInfrastructureKey(),
      nonce,
    );
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(serverShare)),
      cipher.final(),
    ]);
    return {
      ciphertext: encrypted.toString('base64'),
      nonce: nonce.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      infrastructureKeyVersion: INFRASTRUCTURE_KEY_VERSION,
    };
  }

  decrypt(encrypted: EncryptedServerShare): Uint8Array {
    if (encrypted.infrastructureKeyVersion !== INFRASTRUCTURE_KEY_VERSION) {
      throw new Error('Unsupported infrastructure key version');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      decodeInfrastructureKey(),
      decodeBase64Field(encrypted.nonce, NONCE_LENGTH, 'ServerShare nonce'),
    );
    decipher.setAuthTag(
      decodeBase64Field(encrypted.authTag, 16, 'ServerShare auth tag'),
    );
    const serverShare = Buffer.concat([
      decipher.update(
        decodeBase64Field(
          encrypted.ciphertext,
          SERVER_SHARE_LENGTH,
          'ServerShare ciphertext',
        ),
      ),
      decipher.final(),
    ]);
    if (serverShare.length !== SERVER_SHARE_LENGTH) {
      throw new Error('Invalid decrypted ServerShare');
    }
    return new Uint8Array(serverShare);
  }
}
