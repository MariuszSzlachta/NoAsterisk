// ═══════════════════════════════════════════════════════════════════
// User Settings — RestoreDialog Component
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';

// ─── Props ───────────────────────────────────────────────────────

interface RestoreDialogProps {
  readonly backupDate: string;
  readonly onRestore: (password: string) => void;
  readonly onCancel: () => void;
}

// ─── Component ───────────────────────────────────────────────────

export const RestoreDialog = ({
  backupDate,
  onRestore,
  onCancel,
}: RestoreDialogProps): React.JSX.Element => {
  const [password, setPassword] = useState('');
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

  const isValid = password.length >= 1;

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
        aria-labelledby="restore-dialog-title"
      >
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
          <RotateCcw size={20} className="text-primary" aria-hidden="true" />
        </div>

        <h2 id="restore-dialog-title" className="mb-1 text-base font-semibold text-foreground">
          Znaleziono backup
        </h2>
        <p className="mb-1 text-sm text-muted-foreground">
          Backup z dnia: <span className="font-medium text-foreground">{backupDate}</span>
        </p>
        <p className="mb-4 text-sm text-muted-foreground">
          Przywrócenie nadpisze Twoje obecne dane lokalne. Upewnij się, że masz aktualne dane wyeksportowane.
        </p>

        <div className="mb-4">
          <Input
            label="Hasło do odszyfrowania"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Wpisz hasło konta"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Zacznij od nowa
          </Button>
          <Button
            onClick={() => onRestore(password)}
            disabled={!isValid}
          >
            Przywróć dane
          </Button>
        </div>
      </div>
    </div>
  );
};
