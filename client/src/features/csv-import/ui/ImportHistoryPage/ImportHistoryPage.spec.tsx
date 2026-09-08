import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ImportHistoryRecord } from '#features/csv-import/model/history/types';
import { useImportHistoryStore } from '#features/csv-import/store/useImportHistoryStore';
import { ImportHistoryPage } from '#features/csv-import/ui/ImportHistoryPage/ImportHistoryPage';

const deleteImportHistoryBatchMock = vi.hoisted(() =>
  vi.fn<() => Promise<void>>(),
);

vi.mock('#features/csv-import/model/persistence', () => ({
  deleteImportHistoryBatch: (...args: unknown[]) =>
    deleteImportHistoryBatchMock(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'pl' },
    t: (key: string, params?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'importHistory.completedAt': `Zakończono: ${params?.date ?? ''}`,
        'importHistory.delete': `Usuń import ${params?.fileName ?? ''}`,
        'importHistory.deleteDialog.cancel': 'Anuluj',
        'importHistory.deleteDialog.confirm': 'Usuń import',
        'importHistory.deleteDialog.description': `Usunąć wszystkie transakcje z pliku ${params?.fileName ?? ''}?`,
        'importHistory.deleteDialog.deleting': 'Usuwanie…',
        'importHistory.deleteDialog.title': 'Usuń import',
        'importHistory.description': 'Historia lokalnych importów CSV',
        'importHistory.empty.action': 'Rozpocznij import',
        'importHistory.empty.description': 'Brak zapisanych importów.',
        'importHistory.empty.title': 'Brak importów',
        'importHistory.importMore': 'Importuj ponownie',
        'importHistory.stats.accepted': 'Nowe transakcje',
        'importHistory.stats.duplicates': 'Duplikaty',
        'importHistory.stats.rejected': 'Odrzucone',
        'importHistory.title': 'Historia importów',
      };
      return map[key] ?? key;
    },
  }),
}));

const RECORD: ImportHistoryRecord = {
  batchId: 'batch-1',
  fileName: 'statement.csv',
  completedAt: '2026-09-08T10:00:00.000Z',
  acceptedCount: 12,
  duplicateCount: 2,
  rejectedCount: 1,
};

const renderPage = (): void => {
  render(
    <MemoryRouter>
      <ImportHistoryPage />
    </MemoryRouter>,
  );
};

describe('ImportHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useImportHistoryStore.setState({ history: [] });
    deleteImportHistoryBatchMock.mockResolvedValue(undefined);
  });

  it('renders the empty state with an import action', () => {
    renderPage();

    expect(screen.getByText('Brak importów')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Rozpocznij import' }),
    ).toHaveAttribute('href', '/import');
  });

  it('renders populated history and opens destructive confirmation', async () => {
    const user = userEvent.setup();
    useImportHistoryStore.setState({ history: [RECORD] });
    renderPage();

    expect(screen.getByText('statement.csv')).toBeInTheDocument();
    expect(screen.getByText('Nowe transakcje')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Usuń import statement.csv' }),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/wszystkie transakcje/)).toBeInTheDocument();
    expect(deleteImportHistoryBatchMock).not.toHaveBeenCalled();
  });
});
