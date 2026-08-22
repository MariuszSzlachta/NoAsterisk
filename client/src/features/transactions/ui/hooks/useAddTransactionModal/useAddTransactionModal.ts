// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — useAddTransactionModal Hook
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────

interface UseAddTransactionModalResult {
  readonly isModalOpen: boolean;
  readonly handleOpenModal: () => void;
  readonly handleCloseModal: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useAddTransactionModal = (): UseAddTransactionModalResult => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (): void => {
    setIsModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
  };

  return {
    isModalOpen,
    handleOpenModal,
    handleCloseModal,
  };
};
