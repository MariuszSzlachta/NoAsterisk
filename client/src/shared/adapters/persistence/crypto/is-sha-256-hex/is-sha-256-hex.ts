import {
  SHA_256_HEX_DIGITS,
  SHA_256_HEX_LENGTH,
} from '#shared/adapters/persistence/crypto/constants';

/** Checks the canonical lowercase hexadecimal representation of a SHA-256 digest. */
export const isSha256Hex = (value: string): boolean =>
  value.length === SHA_256_HEX_LENGTH &&
  value.split('').every((character) => SHA_256_HEX_DIGITS.includes(character));
