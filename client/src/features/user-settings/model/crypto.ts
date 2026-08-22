// ═══════════════════════════════════════════════════════════════════
// User Settings Feature — Vault Crypto (E2EE: PBKDF2 → AES-GCM-256)
// ═══════════════════════════════════════════════════════════════════
//
// All encryption/decryption happens client-side. The server stores
// only an opaque encrypted blob — never plaintext.
//
// Binary format: salt(16) || iv(12) || ciphertext
// Encoding: base64 (chunk-safe for large payloads)
// ═══════════════════════════════════════════════════════════════════

// ─── Constants ───────────────────────────────────────────────────

const PBKDF2_ITERATIONS = 600_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256; // bits
const BASE64_CHUNK_SIZE = 8192;

// ─── Internal Helpers ────────────────────────────────────────────

const deriveKey = async (
  password: string,
  salt: Uint8Array,
  usage: 'encrypt' | 'decrypt',
): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    [usage],
  );
};

/**
 * Chunk-safe Uint8Array → base64 encoding.
 * Avoids call stack overflow for large payloads (>1MB).
 */
const uint8ToBase64 = (bytes: Uint8Array): string => {
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + BASE64_CHUNK_SIZE);
    parts.push(String.fromCharCode(...chunk));
  }
  return btoa(parts.join(''));
};

/**
 * Base64 → Uint8Array decoding.
 */
const base64ToUint8 = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// ─── Public API ──────────────────────────────────────────────────

/**
 * Encrypts plaintext data for vault storage.
 * Uses PBKDF2 key derivation + AES-GCM-256 authenticated encryption.
 * Output format: base64(salt[16] || iv[12] || ciphertext)
 *
 * Each call generates fresh random salt and IV — same input produces different output.
 */
export const encryptVault = async (plaintext: string, password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt, 'encrypt');

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  );

  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

  return uint8ToBase64(combined);
};

/**
 * Decrypts vault blob back to plaintext.
 * Input: base64 string (from server), password.
 *
 * @throws VaultDecryptionError if password is wrong or data is corrupted.
 */
export const decryptVault = async (encryptedBase64: string, password: string): Promise<string> => {
  const decoder = new TextDecoder();
  const binary = base64ToUint8(encryptedBase64);

  if (binary.length < SALT_LENGTH + IV_LENGTH + 1) {
    throw new VaultDecryptionError('Invalid vault data: too short');
  }

  const salt = binary.slice(0, SALT_LENGTH);
  const iv = binary.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = binary.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt, 'decrypt');

  try {
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext,
    );
    return decoder.decode(plainBuffer);
  } catch {
    throw new VaultDecryptionError('Decryption failed — wrong password or corrupted data');
  }
};

// ─── Error Type ──────────────────────────────────────────────────

export class VaultDecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VaultDecryptionError';
  }
}

// ─── Vault Payload Parsing ───────────────────────────────────────

/**
 * Validated vault payload structure.
 * Contains raw validated items — consumers cast to concrete store types at hydration boundary.
 */
export interface VaultPayload {
  readonly transactions: ReadonlyArray<Record<string, unknown>>;
  readonly rules: ReadonlyArray<Record<string, unknown>>;
}

/**
 * Validates that an item is a non-null object with a string 'id' field.
 */
const isValidVaultItem = (item: unknown): item is Record<string, unknown> =>
  typeof item === 'object' && item !== null && 'id' in item && typeof (item as Record<string, unknown>).id === 'string';

/**
 * Decrypts vault blob and validates payload structure.
 * Returns typed payload ready for store hydration.
 *
 * @throws VaultDecryptionError if password is wrong, data corrupted, or payload shape invalid.
 */
export const decryptVaultPayload = async (
  encryptedBlob: string,
  password: string,
): Promise<VaultPayload> => {
  const plaintext = await decryptVault(encryptedBlob, password);

  let parsed: unknown;
  try {
    parsed = JSON.parse(plaintext);
  } catch {
    throw new VaultDecryptionError('Decrypted data is not valid JSON');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new VaultDecryptionError('Decrypted payload is not an object');
  }

  const obj = parsed as Record<string, unknown>;
  const rawTransactions = Array.isArray(obj.transactions) ? obj.transactions : [];
  const rawRules = Array.isArray(obj.rules) ? obj.rules : [];

  const transactions = (rawTransactions as unknown[]).filter(isValidVaultItem);
  const rules = (rawRules as unknown[]).filter(isValidVaultItem);

  return { transactions, rules };
};
