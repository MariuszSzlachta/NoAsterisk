import { Button } from '#shared/ui/Button';
import { Modal } from '#shared/ui/Modal';

interface ConfirmDialogProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  readonly cancelLabel: string;
  readonly confirmLabel: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps): React.JSX.Element | null => (
  <Modal
    isOpen={isOpen}
    title={title}
    closeLabel={cancelLabel}
    onClose={onCancel}
  >
    <p className="text-sm text-muted-foreground">{description}</p>
    <div className="mt-6 flex justify-end gap-2">
      <Button type="button" variant="secondary" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button type="button" variant="destructive" onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);
