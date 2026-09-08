import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface DropdownMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export interface DropdownMenuSeparator {
  type: 'separator';
}

export type DropdownMenuEntry = DropdownMenuItem | DropdownMenuSeparator;

interface DropdownMenuProps {
  items: DropdownMenuEntry[];
  trigger?: ReactNode;
  align?: 'left' | 'right';
}

const KebabIcon = (): React.JSX.Element => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

export const DropdownMenu = ({
  items,
  trigger,
  align = 'right',
}: DropdownMenuProps): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClick = (e: MouseEvent): void => {
      if (!(e.target instanceof Node)) {
        return;
      }
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleToggle = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: align === 'right' ? rect.right - 140 : rect.left,
      });
    }
    setOpen(!open);
  };

  return (
    <>
      <button
        ref={btnRef}
        className="flex h-7 w-7 items-center justify-center rounded-md text-subtle outline-none transition-colors hover:bg-surface-3 hover:text-foreground"
        onClick={handleToggle}
      >
        {trigger ?? <KebabIcon />}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] min-w-[140px] rounded-lg border border-border bg-surface p-1 shadow-card"
            style={{ top: pos.top, left: pos.left }}
          >
            {items.map((item, i) => {
              if ('type' in item) {
                return <div key={`sep-${i}`} className="my-1 h-px bg-border" />;
              }
              return (
                <button
                  key={item.label}
                  disabled={item.disabled}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs outline-none ${
                    item.disabled
                      ? 'cursor-not-allowed text-subtle opacity-50'
                        : item.variant === 'danger'
                        ? 'text-expense hover:bg-expense-soft'
                        : 'text-foreground hover:bg-surface-3'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!item.disabled) {
                      item.onClick();
                      setOpen(false);
                    }
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
};
