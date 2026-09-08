import { HEX_ENCODING } from '#shared/lib/bytes-to-hex/constants/hex-encoding';

/** Converts binary bytes to the canonical lowercase hexadecimal representation used by hashes. */
export const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) =>
    byte
      .toString(HEX_ENCODING.radix)
      .padStart(HEX_ENCODING.width, HEX_ENCODING.padding),
  ).join('');
