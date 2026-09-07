import type { ConfirmDialogField } from '#features/user-settings/ui/ConfirmDialog/confirm-dialog-field';

export interface ConfirmDialogProps {
  readonly title: string;
  readonly description: string;
  readonly confirmText: string;
  readonly confirmButtonLabel: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly extraFields?: ReadonlyArray<ConfirmDialogField>;
}
