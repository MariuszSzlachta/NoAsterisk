import { buildVaultRecords } from '#features/user-settings/model/build-vault-records';
import { createValidatedVaultPayload } from '#features/user-settings/model/create-validated-vault-payload';
import { serializeVaultPayload } from '#features/user-settings/model/vault-payload';

export const downloadVaultExport = (): void => {
  const payload = createValidatedVaultPayload(buildVaultRecords());
  const blob = new Blob([serializeVaultPayload(payload)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `budget-export-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};
