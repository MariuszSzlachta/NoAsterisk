import {
  createVaultPayload,
  isVaultPayload,
  type VaultPayload,
  type VaultRecords,
} from '#features/user-settings/model/vault-payload';

export const createValidatedVaultPayload = (
  records: VaultRecords,
): VaultPayload => {
  const payload = createVaultPayload(records);
  if (!isVaultPayload(payload)) {
    throw new Error('Local vault data failed validation');
  }
  return payload;
};
