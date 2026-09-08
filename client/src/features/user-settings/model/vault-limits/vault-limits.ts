/** Matches the server-side encryptedBlob validation limit. */
export const MAX_ENCRYPTED_VAULT_LENGTH = 10_000_000;

/** Prevents expensive parsing and staging of oversized plaintext imports. */
export const MAX_PLAINTEXT_VAULT_LENGTH = 7_500_000;
