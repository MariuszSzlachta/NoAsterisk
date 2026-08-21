// ═══════════════════════════════════════════════════════════════════
// User Settings — ConfirmDialog Component
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';

// ─── Types ───────────────────────────────────────────────────────

interface ConfirmDialogField {
  readonly label: string;
  readonly type: 'text' | 'password';
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

interface ConfirmDialogProps {
  readonly title: string;
  readonly description: string;
  readonly confirmText: string;
  readonly confirmButtonLabel: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly extraFields?: ReadonlyArray<ConfirmDialogField>;
}

// ─── Component ───────────────────────────────────────────────────

export const ConfirmDialog = ({
  title,
  description,
  confirmText,
  confirmButtonLabel,
  onConfirm,
  onCancel,
  extraFields,
}: ConfirmDialogProps): React.JSX.Element => {
  const [inputValue, setInputValue] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    return () => { document.removeEventListener('keydown', handleKeyDown); };
  }, [onCancel]);

  const isConfirmEnabled = inputValue === confirmText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onCancel}
        role="presentation"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative mx-4 w-full max-w-[440px] rounded-xl border border-border bg-surface p-6 shadow-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-expense-soft">
          <AlertTriangle size={20} className="text-expense" aria-hidden="true" />
        </div>

        <h2 id="confirm-dialog-title" className="mb-1 text-base font-semibold text-foreground">
          {title}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {description}
        </p>

        {extraFields?.map((field) => (
          <div key={field.label} className="mb-3">
            <Input
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          </div>
        ))}

        <div className="mb-4">
          <Input
            label={`Wpisz "${confirmText}" aby potwierdzić`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={confirmText}
            className="font-mono"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Anuluj
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!isConfirmEnabled}
          >
            {confirmButtonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
