import type { VaultPasswordMode } from '#features/user-settings/ui/VaultPasswordDialog/vault-password-mode';

export interface VaultPasswordDialogProps {
  readonly mode: VaultPasswordMode;
  readonly error: string | undefined;
  readonly isLoading: boolean;
  readonly onSubmit: (password: string) => void;
  readonly onCancel: () => void;
}
