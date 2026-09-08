import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ImportConfirmStep } from '#features/csv-import/ui/ImportConfirmStep/ImportConfirmStep';
import type { ImportProgress } from '#features/csv-import/model/types';

const mockHandleSubmit = vi.fn();
const mockHandlePrevStep = vi.fn();

const buildIdleProgress = (): ImportProgress => ({
  totalRows: 0,
  savedRows: 0,
  duplicatesSkipped: 0,
  rejectedRows: [],
  errors: [],
  status: 'idle',
});

let mockProgress = buildIdleProgress();
let mockCanSubmit = true;
let mockImportableCount = 247;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'import.confirm.title': 'Potwierdzenie importu',
        'import.confirm.readyDescription': `Gotowe do importu: ${params?.count ?? ''} transakcji`,
        'import.confirm.submit': 'Importuj transakcje',
        'import.confirm.saved': `Zapisano: ${params?.count ?? ''}`,
        'import.confirm.success': 'Import zakończony',
        'import.confirm.successDetail': `Zapisano: ${params?.saved ?? ''}, pominięto: ${params?.duplicates ?? ''}`,
        'import.confirm.failed': 'Import nieudany',
        'import.confirm.partialSuccess': `Częściowo: ${params?.saved ?? ''}`,
        'import.confirm.rejectedRow': `Wiersz ${params?.row ?? ''} pominięto: ${params?.reason ?? ''}`,
        'import.nav.back': 'Wstecz',
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock('#features/csv-import/ui/hooks/useImportSubmit', () => ({
  useImportSubmit: () => ({
    progress: mockProgress,
    handleSubmit: mockHandleSubmit,
    canSubmit: mockCanSubmit,
    importableCount: mockImportableCount,
  }),
}));

vi.mock('#features/csv-import/ui/hooks/useImportWizard', () => ({
  useImportWizard: () => ({
    handlePrevStep: mockHandlePrevStep,
  }),
}));

describe('ImportConfirmStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProgress = buildIdleProgress();
    mockCanSubmit = true;
    mockImportableCount = 247;
  });

  describe('idle state', () => {
    it('renders title', () => {
      render(<ImportConfirmStep />);

      expect(screen.getByText('Potwierdzenie importu')).toBeInTheDocument();
    });

    it('renders ready description with importable count', () => {
      render(<ImportConfirmStep />);

      expect(screen.getByText(/Gotowe do importu: 247/)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<ImportConfirmStep />);

      expect(screen.getByText('Importuj transakcje')).toBeInTheDocument();
    });

    it('renders Wstecz button', () => {
      render(<ImportConfirmStep />);

      expect(screen.getByText('Wstecz')).toBeInTheDocument();
    });

    it('calls handleSubmit when submit button clicked', async () => {
      const user = userEvent.setup();
      render(<ImportConfirmStep />);

      await user.click(screen.getByText('Importuj transakcje'));

      expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });

    it('calls handlePrevStep when Wstecz clicked', async () => {
      const user = userEvent.setup();
      render(<ImportConfirmStep />);

      await user.click(screen.getByText('Wstecz'));

      expect(mockHandlePrevStep).toHaveBeenCalledTimes(1);
    });

    it('disables submit button when canSubmit is false', () => {
      mockCanSubmit = false;
      render(<ImportConfirmStep />);

      const submitButton = screen.getByText('Importuj transakcje');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('submitting state', () => {
    beforeEach(() => {
      mockProgress = {
        totalRows: 247,
        savedRows: 100,
        duplicatesSkipped: 0,
        errors: [],
        rejectedRows: [],
        status: 'submitting',
      };
    });

    it('shows saved count while writing locally', () => {
      render(<ImportConfirmStep />);

      expect(screen.getByText('Zapisano: 100')).toBeInTheDocument();
    });

    it('disables Wstecz button during submission', () => {
      render(<ImportConfirmStep />);

      const backButton = screen.getByText('Wstecz');
      expect(backButton).toBeDisabled();
    });

    it('does not show submit button during submission', () => {
      render(<ImportConfirmStep />);

      expect(screen.queryByText('Importuj transakcje')).not.toBeInTheDocument();
    });
  });

  describe('completed state', () => {
    beforeEach(() => {
      mockProgress = {
        totalRows: 247,
        savedRows: 240,
        duplicatesSkipped: 7,
        errors: [],
        rejectedRows: [],
        status: 'completed',
      };
    });

    it('shows success message', () => {
      render(<ImportConfirmStep />);

      expect(screen.getByText('Import zakończony')).toBeInTheDocument();
    });

    it('shows saved and duplicate counts', () => {
      render(<ImportConfirmStep />);

      expect(
        screen.getByText(/Zapisano: 240.*pominięto: 7/),
      ).toBeInTheDocument();
    });

    it('shows rejected rows in the completion summary', () => {
      mockProgress = {
        totalRows: 247,
        savedRows: 240,
        duplicatesSkipped: 6,
        errors: [],
        rejectedRows: [{ rowIndex: 8, reason: 'Needs review' }],
        status: 'completed',
      };
      render(<ImportConfirmStep />);

      expect(screen.getByText('Wiersz 9 pominięto: Needs review')).toBeInTheDocument();
    });

    it('disables Wstecz button after completion', () => {
      render(<ImportConfirmStep />);

      const backButton = screen.getByText('Wstecz');
      expect(backButton).toBeDisabled();
    });
  });

  describe('failed state', () => {
    beforeEach(() => {
      mockProgress = {
        totalRows: 247,
        savedRows: 150,
        duplicatesSkipped: 0,
        errors: ['Storage unavailable'],
        rejectedRows: [
          { rowIndex: 3, reason: 'Duplicate row' },
          { rowIndex: 4, reason: 'Duplicate row' },
        ],
        status: 'failed',
      };
      mockCanSubmit = true;
    });

    it('shows failure message', () => {
      render(<ImportConfirmStep />);

      expect(screen.getByText('Import nieudany')).toBeInTheDocument();
    });

    it('shows error messages', () => {
      render(<ImportConfirmStep />);

      expect(screen.getByText('Storage unavailable')).toBeInTheDocument();
      expect(screen.getByText('Wiersz 4 pominięto: Duplicate row')).toBeInTheDocument();
      expect(screen.getByText('Wiersz 5 pominięto: Duplicate row')).toBeInTheDocument();
    });

    it('shows partial success info', () => {
      render(<ImportConfirmStep />);

      expect(screen.getByText(/Częściowo: 150/)).toBeInTheDocument();
    });

    it('shows submit button for retry', () => {
      render(<ImportConfirmStep />);

      expect(screen.getByText('Importuj transakcje')).toBeInTheDocument();
    });

    it('enables Wstecz button on failure', () => {
      render(<ImportConfirmStep />);

      const backButton = screen.getByText('Wstecz');
      expect(backButton).not.toBeDisabled();
    });
  });
});
