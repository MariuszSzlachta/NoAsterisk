export interface RotationRecoveryConfirmation {
  readonly recoveryCode: string | undefined;
  readonly confirmation: string;
  readonly canConfirm: boolean;
  readonly confirmationError: string | undefined;
  readonly confirmRecoveryCode: (code: string) => Promise<boolean>;
  readonly handleConfirmationChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  readonly handleConfirm: () => void;
  readonly handleCancel: () => void;
  readonly handleDownload: () => void;
}
