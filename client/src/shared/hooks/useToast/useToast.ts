// ═══════════════════════════════════════════════════════════════════
// Shared — useToast Hook (Zustand store for toast notifications)
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  readonly id: string;
  readonly message: string;
  readonly kind: ToastKind;
}

interface ToastState {
  readonly toasts: ReadonlyArray<ToastItem>;
  readonly addToast: (message: string, kind: ToastKind) => void;
  readonly removeToast: (id: string) => void;
}

// ─── Constants ───────────────────────────────────────────────────

const AUTO_DISMISS_MS = 4000;

// ─── Store ───────────────────────────────────────────────────────

export const useToast = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, kind) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, message, kind }] }));

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, AUTO_DISMISS_MS);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
