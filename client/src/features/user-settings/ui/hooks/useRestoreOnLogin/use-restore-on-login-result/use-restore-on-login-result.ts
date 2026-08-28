export interface UseRestoreOnLoginResult {
  readonly showDialog: boolean;
  readonly backupDate: string;
  readonly isRestoring: boolean;
  readonly error: string | undefined;
  readonly handleRestore: (password: string) => void;
  readonly handleDismiss: () => void;
}
