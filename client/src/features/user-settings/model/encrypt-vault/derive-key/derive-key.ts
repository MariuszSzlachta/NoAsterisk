import { derivePersistenceKey } from '#shared/adapters/persistence/crypto';

export const deriveKey = async (
  password: string,
  salt: Uint8Array,
  _usage: 'encrypt' | 'decrypt',
): Promise<CryptoKey> => {
  return derivePersistenceKey(password, salt.slice().buffer);
};
