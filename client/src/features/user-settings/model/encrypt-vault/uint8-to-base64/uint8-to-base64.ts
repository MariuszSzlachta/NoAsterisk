import { BASE64_CHUNK_SIZE } from '#features/user-settings/model/encrypt-vault/constants/base64-chunk-size';

/** Chunk-safe Uint8Array → base64 encoding. Avoids call stack overflow for large payloads (>1MB). */
export const uint8ToBase64 = (bytes: Uint8Array): string => {
  const chunkCount = Math.ceil(bytes.length / BASE64_CHUNK_SIZE);
  const parts = Array.from({ length: chunkCount }, (_, i) => {
    const chunk = bytes.subarray(i * BASE64_CHUNK_SIZE, (i + 1) * BASE64_CHUNK_SIZE);
    return String.fromCharCode(...chunk);
  });
  return btoa(parts.join(''));
};
