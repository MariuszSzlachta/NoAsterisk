import { z } from 'zod';
import { getBase64DecodedByteSize } from '@user-settings/presentation/dto/opaque-vault/get-base64-decoded-byte-size';
import { VAULT_LIMITS } from '@user-settings/presentation/dto/vault-limits';

export const uploadVaultSchema = z
  .object({
    encryptedBlob: z
      .string()
      .min(1)
      .max(VAULT_LIMITS.maxEncodedBytes)
      .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/)
      .refine(
        (value) =>
          getBase64DecodedByteSize(value) <= VAULT_LIMITS.maxDecodedBytes,
        'Vault payload exceeds decoded size limit',
      ),
    baseRevision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  })
  .strict();
