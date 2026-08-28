export interface ConfirmDialogProps {
  readonly title: string;
  readonly description: string;
  readonly confirmText: string;
  readonly confirmButtonLabel: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly extraFields?: ReadonlyArray<ConfirmDialogField>;
}
