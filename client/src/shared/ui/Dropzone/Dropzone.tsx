import { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

import { Button } from '#shared/ui/Button';

type DropzoneStatus = 'idle' | 'dragover' | 'error';

interface DropzoneProps {
  readonly accept?: string;
  readonly maxSizeMb?: number;
  readonly onFileSelect: (file: File) => void;
  readonly error?: string;
  readonly className?: string;
}

const STATUS_CLASSES: Record<DropzoneStatus, string> = {
  idle: 'border-border bg-surface-2',
  dragover: 'border-primary bg-primary/5',
  error: 'border-expense bg-expense-soft/10',
};

export const Dropzone = ({
  accept = '.csv',
  maxSizeMb = 10,
  onFileSelect,
  error,
  className = '',
}: DropzoneProps): React.JSX.Element => {
  const [status, setStatus] = useState<DropzoneStatus>(
    error ? 'error' : 'idle',
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback(
    (file: File): string | null => {
      if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
        return `Plik przekracza ${maxSizeMb} MB`;
      }
      if (accept && !file.name.toLowerCase().endsWith('.csv')) {
        return 'Dozwolone tylko pliki .csv';
      }
      return null;
    },
    [accept, maxSizeMb],
  );

  const handleFile = useCallback(
    (file: File): void => {
      const validationError = validate(file);
      if (validationError) {
        setStatus('error');
        return;
      }
      setStatus('idle');
      onFileSelect(file);
    },
    [validate, onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent): void => {
      e.preventDefault();
      setStatus('idle');
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    setStatus('dragover');
  }, []);

  const handleDragLeave = useCallback((): void => {
    setStatus('idle');
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleButtonClick = useCallback((): void => {
    inputRef.current?.click();
  }, []);

  const currentStatus = error ? 'error' : status;

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors ${STATUS_CLASSES[currentStatus]} ${className}`}
      role="button"
      tabIndex={0}
      aria-label="Upuść plik CSV lub kliknij aby wybrać"
    >
      <Upload size={24} className="text-muted-foreground" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Przeciągnij i upuść plik CSV
        </p>
        <p className="text-xs text-muted-foreground">
          lub kliknij, aby wybrać z dysku · maks. {maxSizeMb} MB
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={handleButtonClick}>
        Wybierz plik
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
        data-testid="file-input"
      />
      {error && <p className="text-xs text-expense">{error}</p>}
    </div>
  );
};
