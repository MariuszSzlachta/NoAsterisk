import { parseVaultPayload } from '#features/user-settings/model/parse-vault-payload';
import { MAX_PLAINTEXT_VAULT_LENGTH } from '#features/user-settings/model/vault-limits';
import type { VaultRestoreScope } from '#features/user-settings/ui/hooks/capture-vault-restore-scope/types';
import { restoreVaultPayload } from '#features/user-settings/ui/hooks/restore-vault-payload';
import { vaultOperationQueue } from '#model/vault/lib/vault-operation-queue';

export const restoreVaultFile = async (
  file: File,
  scope: VaultRestoreScope,
): Promise<'too-large' | undefined> => {
  const text = await file.text();
  scope.assertCurrent();
  if (new TextEncoder().encode(text).length > MAX_PLAINTEXT_VAULT_LENGTH)
    return 'too-large';
  const payload = parseVaultPayload(text);
  await vaultOperationQueue(() => restoreVaultPayload(payload, scope));
  return undefined;
};
