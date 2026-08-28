export interface VaultPasswordDialogProps {
  readonly mode: VaultPasswordMode;
  readonly error: string | undefined;
  readonly isLoading: boolean;
  readonly onSubmit: (password: string) => void;
  readonly onCancel: () => void;
}
