import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

interface SelectProps {
  readonly options: readonly SelectOption[];
  readonly value?: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly showDot?: boolean;
  readonly disabled?: boolean;
  readonly className?: string;
}

export const Select = ({
  options,
  value,
  onChange,
  placeholder = 'Wybierz...',
  showDot = false,
  disabled = false,
  className = '',
}: SelectProps): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find((o) => o.value === value);

  const openList = useCallback((): void => {
    if (disabled) {
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setHighlightIndex(value ? options.findIndex((o) => o.value === value) : 0);
    setOpen(true);
  }, [disabled, options, value]);

  const close = useCallback((): void => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const selectOption = useCallback(
    (optionValue: string): void => {
      onChange(optionValue);
      close();
    },
    [onChange, close],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleOutside = (e: MouseEvent): void => {
      if (
        listRef.current &&
        !listRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, close]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          openList();
        }
        return;
      }
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightIndex((i) => Math.min(i + 1, options.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightIndex >= 0) {
            selectOption(options[highlightIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [open, openList, close, selectOption, highlightIndex, options],
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        className={`inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-sm transition-colors hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        onClick={open ? close : openList}
        onKeyDown={handleKeyDown}
      >
        <span className="flex items-center gap-2 truncate">
          {showDot && selectedOption && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-income" />
          )}
          <span
            className={
              selectedOption ? 'text-foreground' : 'text-muted-foreground'
            }
          >
            {selectedOption?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
      </button>
      {open &&
        createPortal(
          <ul
            ref={listRef}
            role="listbox"
            className="fixed z-[9999] max-h-60 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-card"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {options.map((option, i) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-sm ${
                  i === highlightIndex
                    ? 'bg-surface-3 text-foreground'
                    : 'text-foreground'
                } ${option.value === value ? 'font-medium' : ''}`}
                onMouseEnter={() => setHighlightIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectOption(option.value);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
};
