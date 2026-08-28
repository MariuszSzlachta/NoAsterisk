import type { MutationState } from '#features/user-settings/api/useUploadVaultMutation/mutation-state';
import type { UploadVaultBody } from '#features/user-settings/api/useUploadVaultMutation/upload-vault-body';
import type { UploadVaultResponse } from '#features/user-settings/api/useUploadVaultMutation/upload-vault-response';

export interface UseUploadVaultMutationResult {
  readonly state: MutationState;
  readonly mutateAsync: (body: UploadVaultBody) => Promise<UploadVaultResponse | undefined>;
  readonly reset: () => void;
}
