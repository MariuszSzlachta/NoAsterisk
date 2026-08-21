// ═══════════════════════════════════════════════════════════════════
// Shared — Toast Component (renders all active toasts)
// ═══════════════════════════════════════════════════════════════════

import { CheckCircle, Info, X, XCircle } from 'lucide-react';

import { useToast } from '#shared/hooks/useToast';
import type { ToastKind } from '#shared/hooks/useToast';

// ─── Kind Config ─────────────────────────────────────────────────

const KIND_CONFIG: Record<ToastKind, { icon: React.ReactNode; containerClass: string }> = {
  success: {
    icon: <CheckCircle size={16} className="text-income" />,
    containerClass: 'border-income/30',
  },
  error: {
    icon: <XCircle size={16} className="text-expense" />,
    containerClass: 'border-expense/30',
  },
  info: {
    icon: <Info size={16} className="text-primary" />,
    containerClass: 'border-primary/30',
  },
};

// ─── Component ───────────────────────────────────────────────────

export const ToastContainer = (): React.JSX.Element | null => {
  const toasts = useToast((s) => s.toasts);
  const removeToast = useToast((s) => s.removeToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const config = KIND_CONFIG[toast.kind];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-2 rounded-lg border bg-surface px-4 py-3 shadow-card ${config.containerClass}`}
            role="alert"
          >
            <span aria-hidden="true">{config.icon}</span>
            <span className="text-sm text-foreground">{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-subtle transition-colors hover:text-foreground"
              aria-label="Zamknij powiadomienie"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
