import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface SelectionAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface SelectionToolbarProps {
  count: number;
  actions: SelectionAction[];
  onClear: () => void;
  label?: string;
}

export const SelectionToolbar = ({
  count,
  actions,
  onClear,
  label = 'zaznaczono',
}: SelectionToolbarProps): React.JSX.Element | null => {
  if (count === 0) return null;

  return createPortal(
    <div className="animate-toolbar-enter fixed inset-x-0 bottom-6 z-[9998] mx-auto flex w-fit items-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-card">
      <span className="text-xs text-muted-foreground">
        <span className="font-mono font-medium text-foreground">{count}</span> {label}
      </span>

      <div className="h-4 w-px bg-border" />

      {actions.map((action) => (
        <button
          key={action.label}
          disabled={action.disabled}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium outline-none transition-colors ${
            action.disabled
              ? 'cursor-not-allowed text-subtle opacity-50'
              : action.variant === 'danger'
                ? 'text-expense hover:bg-expense-soft'
                : 'text-foreground hover:bg-surface-3'
          }`}
          onClick={action.onClick}
        >
          {action.icon}
          {action.label}
        </button>
      ))}

      <div className="h-4 w-px bg-border" />

      <button
        className="flex items-center justify-center rounded-md p-1 text-subtle outline-none hover:bg-surface-3 hover:text-foreground"
        onClick={onClear}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>,
    document.body,
  );
};
