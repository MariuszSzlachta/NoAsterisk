export interface ConfirmDeleteModalProps {
  readonly title: string;
  readonly description: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}
