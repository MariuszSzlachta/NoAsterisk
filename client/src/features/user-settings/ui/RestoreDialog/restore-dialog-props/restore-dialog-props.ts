export interface RestoreDialogProps {
  readonly backupDate: string;
  readonly isLoading?: boolean;
  readonly error?: string;
  readonly onRestore: (password: string) => void;
  readonly onCancel: () => void;
}
