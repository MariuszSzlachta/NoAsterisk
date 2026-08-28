import { isRecord } from '#features/user-settings/model/decrypt-vault-payload/is-record';

export const isValidVaultItem = (item: unknown): item is Record<string, unknown> =>
  isRecord(item) && 'id' in item && typeof item['id'] === 'string';
