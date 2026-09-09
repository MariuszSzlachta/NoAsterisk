import { uploadVaultSchema } from '@user-settings/presentation/dto/upload-vault.dto';

describe('uploadVaultSchema', () => {
  it.each([
    [
      'valid first upload',
      { encryptedBlob: 'Y2lwaGVydGV4dA==', baseRevision: 0 },
    ],
    ['valid update', { encryptedBlob: 'Y2lwaGVydGV4dA==', baseRevision: 4 }],
  ])('accepts %s', (_, payload) => {
    expect(uploadVaultSchema.safeParse(payload).success).toBe(true);
  });

  it.each([
    ['missing revision', { encryptedBlob: 'Y2lwaGVydGV4dA==' }],
    [
      'negative revision',
      { encryptedBlob: 'Y2lwaGVydGV4dA==', baseRevision: -1 },
    ],
    [
      'non-integer revision',
      { encryptedBlob: 'Y2lwaGVydGV4dA==', baseRevision: 1.5 },
    ],
    [
      'unexpected field',
      { encryptedBlob: 'Y2lwaGVydGV4dA==', baseRevision: 0, secret: 'x' },
    ],
    ['malformed base64', { encryptedBlob: 'not ciphertext', baseRevision: 0 }],
  ])('rejects %s', (_, payload) => {
    expect(uploadVaultSchema.safeParse(payload).success).toBe(false);
  });
});
